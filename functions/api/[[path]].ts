import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { getD1DB } from '../../src/db'
import * as schema from '../../src/db/schema'
import { desc } from 'drizzle-orm'
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types'

// 创建一个基于 /api 路径的应用
const app = new Hono().basePath('/api')

// 定义Cloudflare环境类型
interface Env {
  DB: D1Database; // D1数据库
  APP_KV: KVNamespace; // KV命名空间
  APP_BUCKET: R2Bucket; // R2存储桶
}

// 全局中间件
app.use('*', logger())  // 日志
app.use('*', prettyJSON())  // 美化 JSON
app.use('*', cors())  // CORS

// 禁用缓存的中间件
app.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
})

// Hello API
app.get('/hello', (c) => {
  const name = c.req.query('name') || 'World'
  return c.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString()
  })
})

// 获取数据库表信息 (返回对象名和表名)
app.get('/tables', async (c) => {
  try {
    // 使用原始D1实例查询所有表
    const env = c.env as Env;
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();
    
    // 提取表名
    const databaseTables = result.results.map(row => row.name);
    
    // 输出调试信息
    console.log('数据库中的表:', databaseTables);
    console.log('Schema模块包含的导出项:', Object.keys(schema));
    
    // 从schema中获取对象名和表名映射
    const schemaTables = [];
    for (const key in schema) {
      try {
        const tableObj = schema[key as keyof typeof schema] as any;
        
        // 输出每个schema对象的信息
        console.log(`检查schema对象 "${key}":`, typeof tableObj, tableObj ? Object.keys(tableObj) : null);
        
        if (tableObj && typeof tableObj === 'object') {
          // 安全地尝试获取表名
          let tableName: string | null = null;
          
          // 尝试安全地访问不同的可能位置
          try {
            if (tableObj.config?.name) {
              tableName = tableObj.config.name;
              console.log(`从config.name找到表名: ${tableName}`);
            } else if (tableObj.$type?.name) {
              tableName = tableObj.$type.name;
              console.log(`从$type.name找到表名: ${tableName}`);
            } else if (tableObj._?.tableName) {
              tableName = tableObj._.tableName;
              console.log(`从_.tableName找到表名: ${tableName}`);
            } else if (tableObj.name) {
              tableName = tableObj.name;
              console.log(`从name找到表名: ${tableName}`);
            }
          } catch (propError) {
            console.log(`访问表名属性时出错:`, propError);
          }
          
          // 最后的尝试：从SQL打印中获取表名或将对象名转换为下划线命名
          if (!tableName && typeof tableObj.toString === 'function') {
            const sqlString = tableObj.toString();
            const tableNameMatch = sqlString.match(/CREATE TABLE ["']?([a-zA-Z0-9_]+)["']?/i);
            if (tableNameMatch && tableNameMatch[1]) {
              tableName = tableNameMatch[1];
              console.log(`从SQL字符串找到表名: ${tableName}`);
            }
          }
          
          // 如果还是没找到，使用对象名转换
          if (!tableName) {
            tableName = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
            console.log(`无法找到表名，使用转换后的对象名: ${key} -> ${tableName}`);
          }
          
          schemaTables.push({
            objectName: key,         // JavaScript对象名（驼峰命名）
            tableName: tableName,    // 数据库表名（通常是下划线命名）
            inDatabase: databaseTables.includes(tableName), // 表是否存在于数据库中
            tableKeys: tableObj ? Object.keys(tableObj) : []
          });
        }
      } catch (objError) {
        console.error(`处理schema对象 "${key}" 时出错:`, objError);
      }
    }
    
    console.log('找到的schema表:', schemaTables);
    
    // 找出数据库中存在但schema中未定义的表
    const tablesOnlyInDatabase = databaseTables.filter(
      dbTable => !schemaTables.some(schemaTable => schemaTable.tableName === dbTable)
    ).map(tableName => ({
      tableName,
      objectName: null,
      inDatabase: true,
      inSchema: false
    }));
    
    return c.json({
      success: true,
      tables: {
        // schema中定义的表
        schemaTables,
        // 仅在数据库中存在的表
        tablesOnlyInDatabase,
        // 所有表名列表
        allTableNames: databaseTables
      },
      schemaKeys: Object.keys(schema),
      count: databaseTables.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取表信息失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '获取表信息失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 获取数据库表数据 (使用对象名)
app.get('/table-data/:objectName', async (c) => {
  try {
    // 获取请求的对象名
    const objectName = c.req.param('objectName');
    const env = c.env as Env;
    const db = getD1DB(env);
    
    // 直接从schema中获取表对象
    const tableObj = schema[objectName as keyof typeof schema];
    
    if (!tableObj) {
      // 尝试将下划线表名转换为驼峰对象名
      const camelCaseName = objectName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // 再次尝试查找
      if (camelCaseName !== objectName && camelCaseName in schema) {
        return c.json({
          success: false,
          error: `找不到对象 "${objectName}"，您是否想使用 "${camelCaseName}"?`,
          suggestion: camelCaseName
        }, 404);
      }
      
      return c.json({
        success: false,
        error: `对象 "${objectName}" 不存在于schema中`,
        availableObjects: Object.keys(schema)
      }, 404);
    }
    
    // 使用类型安全的Drizzle查询
    const result = await db.select().from(tableObj).all();
    
    return c.json({
      success: true,
      objectName,
      data: result,
      count: result.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`查询表数据失败:`, error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '查询表数据失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 系统配置API - 使用Drizzle ORM
app.get('/system-config', async (c) => {
  try {
    const db = getD1DB(c.env as Env);
    
    // 使用类型安全的查询方式
    const configs = await db.select().from(schema.systemConfig).all();
    
    return c.json({
      success: true,
      tableName: 'system_config',
      data: configs,
      count: configs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取系统配置数据失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '获取系统配置数据失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 获取系统日志数据 (使用类型安全的Drizzle查询)
app.get('/system-logs', async (c) => {
  try {
    const db = getD1DB(c.env as Env);
    
    // 使用类型安全的查询，并添加分页和排序
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;
    
    const logs = await db.select()
      .from(schema.systemLog)
      .orderBy(desc(schema.systemLog.createdAt))
      .limit(limit)
      .offset(offset)
      .all();
    
    return c.json({
      success: true,
      tableName: 'system_log',
      page,
      limit,
      data: logs,
      count: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取系统日志数据失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '获取系统日志数据失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// KV API - 列出所有键
app.get('/kv-keys', async (c) => {
  try {
    const env = c.env as Env;
    
    if (!env.APP_KV) {
      return c.json({
        success: false,
        error: 'KV绑定不可用，请检查wrangler.toml配置'
      }, 500);
    }
    
    // 列出所有键
    try {
      const list = await env.APP_KV.list();
      
      return c.json({
        success: true,
        keys: list.keys,
        count: list.keys.length,
        timestamp: new Date().toISOString()
      });
    } catch (listError) {
      return c.json({
        success: false,
        error: '列出键失败，请确保在wrangler.toml中设置了正确的KV配置',
        originalError: listError instanceof Error ? listError.message : String(listError)
      }, 400);
    }
  } catch (error) {
    console.error('获取KV键列表失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '获取KV键列表失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// KV API - 获取键值
app.get('/kv-value/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const env = c.env as Env;
    
    if (!env.APP_KV) {
      return c.json({
        success: false,
        error: 'KV绑定不可用，请检查wrangler.toml配置'
      }, 500);
    }
    
    // 从KV读取值
    const value = await env.APP_KV.get(key);
    
    if (value === null) {
      return c.json({
        success: false,
        error: `键 "${key}" 不存在`,
      }, 404);
    }
    
    // 尝试解析JSON
    try {
      const jsonValue = JSON.parse(value);
      return c.json({
        success: true,
        key,
        value: jsonValue,
        isJson: true,
        timestamp: new Date().toISOString()
      });
    } catch {
      // 返回原始值
      return c.json({
        success: true,
        key,
        value,
        isJson: false,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('获取KV值失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '获取KV值失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// R2 API - 列出所有对象
app.get('/files', async (c) => {
  try {
    const env = c.env as Env;
    
    if (!env.APP_BUCKET) {
      return c.json({
        success: false,
        error: 'R2存储桶绑定不可用，请检查wrangler.toml配置'
      }, 500);
    }
    
    // 列出存储桶中的所有对象
    const objects = await env.APP_BUCKET.list();
    
    return c.json({
      success: true,
      files: objects.objects.map(obj => ({
        name: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        etag: obj.etag,
        httpEtag: obj.httpEtag
      })),
      count: objects.objects.length,
      truncated: objects.truncated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取R2对象列表失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '获取R2对象列表失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// R2 API - 获取对象元数据
app.on('HEAD', '/files/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const env = c.env as Env;
    
    if (!env.APP_BUCKET) {
      return c.json({
        success: false,
        error: 'R2存储桶绑定不可用，请检查wrangler.toml配置'
      }, 500);
    }
    
    // 获取对象元数据
    const object = await env.APP_BUCKET.head(key);
    
    if (!object) {
      return c.json({
        success: false,
        error: `文件 "${key}" 不存在`
      }, 404);
    }
    
    // 设置响应头部
    c.header('ETag', object.httpEtag);
    c.header('Last-Modified', object.uploaded.toUTCString());
    c.header('Content-Length', object.size.toString());
    if (object.httpMetadata?.contentType) {
      c.header('Content-Type', object.httpMetadata.contentType);
    }
    
    return c.newResponse(null, { status: 200 });
  } catch (error) {
    console.error('获取R2对象元数据失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '获取R2对象元数据失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// R2 API - 获取对象(下载文件)
app.get('/files/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const env = c.env as Env;
    
    if (!env.APP_BUCKET) {
      return c.json({
        success: false,
        error: 'R2存储桶绑定不可用，请检查wrangler.toml配置'
      }, 500);
    }
    
    // 获取对象
    const object = await env.APP_BUCKET.get(key);
    
    if (!object) {
      return c.json({
        success: false,
        error: `文件 "${key}" 不存在`
      }, 404);
    }
    
    // 如果客户端请求JSON格式的元数据，返回JSON响应
    const acceptHeader = c.req.header('Accept');
    if (acceptHeader && acceptHeader.includes('application/json')) {
      return c.json({
        success: true,
        key,
        size: object.size,
        etag: object.etag,
        httpEtag: object.httpEtag,
        uploaded: object.uploaded,
        metadata: object.httpMetadata,
        timestamp: new Date().toISOString()
      });
    }
    
    // 否则返回实际文件内容
    // 使用arrayBuffer()解决ReadableStream类型不兼容问题
    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    
    // 读取对象为ArrayBuffer
    const arrayBuffer = await object.arrayBuffer();
    
    // 创建响应
    return c.body(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'ETag': object.httpEtag,
        'Last-Modified': object.uploaded.toUTCString(),
        'Content-Length': object.size.toString(),
        'Cache-Control': 'public, max-age=31536000' // 1年缓存，可按需调整
      }
    });
  } catch (error) {
    console.error('获取R2对象失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '获取R2对象失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// R2 API - 上传对象
app.put('/files/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const env = c.env as Env;
    
    if (!env.APP_BUCKET) {
      return c.json({
        success: false,
        error: 'R2存储桶绑定不可用，请检查wrangler.toml配置'
      }, 500);
    }
    
    // 检查内容类型和请求体
    const contentType = c.req.header('Content-Type');
    if (!contentType) {
      return c.json({
        success: false,
        error: '缺少Content-Type头部'
      }, 400);
    }
    
    // 获取请求体
    const data = await c.req.arrayBuffer();
    if (data.byteLength === 0) {
      return c.json({
        success: false,
        error: '请求体为空'
      }, 400);
    }
    
    // 设置元数据
    const httpMetadata = {
      contentType,
      // 可以添加更多自定义元数据
      uploadedBy: c.req.header('X-Uploaded-By') || 'api',
      uploadedAt: new Date().toISOString()
    };
    
    // 上传对象
    const result = await env.APP_BUCKET.put(key, data, {
      httpMetadata
    });
    
    return c.json({
      success: true,
      key,
      etag: result.etag,
      size: data.byteLength,
      contentType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('上传R2对象失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '上传R2对象失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// R2 API - 删除对象
app.delete('/files/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const env = c.env as Env;
    
    if (!env.APP_BUCKET) {
      return c.json({
        success: false,
        error: 'R2存储桶绑定不可用，请检查wrangler.toml配置'
      }, 500);
    }
    
    // 删除对象
    await env.APP_BUCKET.delete(key);
    
    return c.json({
      success: true,
      key,
      message: `文件 "${key}" 已删除`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('删除R2对象失败:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '删除R2对象失败',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// API 信息
app.get('/', (c) => {
  return c.json({
    message: 'API is working!',
    endpoints: [
      '/api',
      '/api/hello',
      '/api/tables',
      '/api/table-data/:objectName',
      '/api/system-config',
      '/api/system-logs',
      '/api/kv-keys',
      '/api/kv-value/:key',
      '/api/files',
      '/api/files/:key'
    ],
    kv_operations: {
      list_keys: 'GET /api/kv-keys - 列出所有KV键',
      get_value: 'GET /api/kv-value/:key - 获取指定键的值'
    },
    r2_operations: {
      list_files: 'GET /api/files - 列出存储桶中的所有文件',
      get_file: 'GET /api/files/:key - 下载文件',
      get_metadata: 'HEAD /api/files/:key - 获取文件元数据',
      upload_file: 'PUT /api/files/:key - 上传文件',
      delete_file: 'DELETE /api/files/:key - 删除文件'
    },
    timestamp: new Date().toISOString()
  })
})

// 错误处理
app.onError((err, c) => {
  console.error(`[Error] ${err.message}`)
  return c.json({
    error: err.message || 'Internal Server Error',
    status: 500
  }, 500)
})

// 404 处理
app.notFound((c) => {
  return c.json({
    error: 'API Not Found',
    path: new URL(c.req.url).pathname,
    timestamp: new Date().toISOString()
  }, 404)
})

export const onRequest = handle(app) 
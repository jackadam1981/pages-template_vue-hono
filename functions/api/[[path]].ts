import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { getD1DB } from '../../src/db'
import * as schema from '../../src/db/schema'
import { desc } from 'drizzle-orm'
import type { D1Database } from '@cloudflare/workers-types'

// 创建一个基于 /api 路径的应用
const app = new Hono().basePath('/api')

// 定义Cloudflare环境类型
interface Env {
  DB: D1Database;
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
      '/api/system-logs'
    ],
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
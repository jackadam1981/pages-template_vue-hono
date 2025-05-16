# Cloudflare KV 存储使用指南

## 目录

- [环境概述](#环境概述)
- [KV 命名空间创建](#kv-命名空间创建)
- [环境配置](#环境配置)
- [命令使用说明](#命令使用说明)
- [高级功能](#高级功能)
- [Dashboard 配置详解](#dashboard-配置详解)
- [常见问题与解决方案](#常见问题与解决方案)

## 环境概述

本项目支持三种标准化环境的 KV (Key-Value) 存储操作：

| 环境名称 | 环境标识 | 命令前缀  | 说明                                           |
|----------|----------|-----------|------------------------------------------------|
| 开发环境 | `dev`    | `kv:dev:` | 本地开发使用，数据存储在 `.wrangler/state` 目录 |
| 预览环境 | `preview`| `kv:preview:` | 对应非主分支部署，用于测试                      |
| 生产环境 | `prod`   | `kv:prod:` | 对应主分支部署，生产环境使用                    |

## KV 命名空间创建

在使用 KV 前，需要创建命名空间：

```bash
# 创建 KV 命名空间
npx wrangler kv:namespace create APP_KV

# 查看已创建的命名空间列表
npm run kv:list
# 或直接使用
npx wrangler kv:namespace list
```

创建后，您将获得类似这样的输出，请保存命名空间ID：

```
✅ Successfully created namespace APP_KV
Created namespace APP_KV with id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 环境配置

项目使用 Cloudflare 的环境配置方式区分不同环境：

1. **开发环境** - 使用 `--local --env dev` 标志，访问本地模拟的 KV 存储
2. **预览环境** - 使用 `--env preview --remote` 标志，访问预览环境配置的 KV 存储
3. **生产环境** - 使用 `--env prod --remote` 标志，访问生产环境配置的 KV 存储

### wrangler.toml 配置示例

```toml
# 全局配置
name = "my-vue-app"
compatibility_date = "2024-05-16"
main = "functions/api/[[path]].ts"

# 开发环境配置 (dev)
[env.dev]
name = "my-vue-app-dev"

# 开发环境 KV 命名空间
[[env.dev.kv_namespaces]]
binding = "APP_KV"
id = "local-dev-kv"

# 预览环境配置 (preview)
[env.preview]
name = "my-vue-app-preview"

# 预览环境 KV 命名空间
[[env.preview.kv_namespaces]]
binding = "APP_KV"
id = "d199c9dbbcbb45beaf78887d696573a6"

# 生产环境配置 (prod)
[env.prod]
name = "my-vue-app"

# 生产环境 KV 命名空间
[[env.prod.kv_namespaces]]
binding = "APP_KV"
id = "d199c9dbbcbb45beaf78887d696573a6"
```

> **最佳实践**：
> - 为不同环境使用独立的KV命名空间，防止开发/测试影响生产数据
> - 遵循统一的环境命名: dev, preview, prod
> - 使用有意义的绑定名称，例如 `APP_KV` 或 `TREASURE_CAVE`

## 命令使用说明

### 管理键值对

```bash
# 列出所有键
npm run kv:dev:list        # 开发环境
npm run kv:preview:list    # 预览环境
npm run kv:prod:list       # 生产环境

# 设置简单值
npm run kv:dev:set:version      # 开发环境设置版本号
npm run kv:preview:set:version  # 预览环境设置版本号
npm run kv:prod:set:version     # 生产环境设置版本号

# 设置JSON配置
npm run kv:dev:set:config      # 开发环境设置JSON配置
npm run kv:preview:set:config  # 预览环境设置JSON配置
npm run kv:prod:set:config     # 生产环境设置JSON配置

# 设置临时值（带TTL）
npm run kv:dev:set:temp      # 开发环境设置临时值
npm run kv:preview:set:temp  # 预览环境设置临时值
npm run kv:prod:set:temp     # 生产环境设置临时值
```

### 直接使用 wrangler 命令

#### 开发环境操作

```bash
# 列出本地KV命名空间中的所有键
npx wrangler kv:key list --env dev --local --binding=APP_KV

# 获取特定键的值
npx wrangler kv:key get --env dev --local --binding=APP_KV "app:version"

# 设置键值对
npx wrangler kv:key put --env dev --local --binding=APP_KV "app:version" "1.0.0"

# 删除键
npx wrangler kv:key delete --env dev --local --binding=APP_KV "app:version"
```

#### 预览环境操作

```bash
# 列出预览环境KV命名空间中的所有键
npx wrangler kv:key list --env preview --remote --binding=APP_KV

# 获取特定键的值
npx wrangler kv:key get --env preview --remote --binding=APP_KV "app:version"

# 设置键值对
npx wrangler kv:key put --env preview --remote --binding=APP_KV "app:version" "1.0.0"

# 删除键
npx wrangler kv:key delete --env preview --remote --binding=APP_KV "app:version"
```

#### 生产环境操作

```bash
# 列出生产环境KV命名空间中的所有键
npx wrangler kv:key list --env prod --remote --binding=APP_KV

# 获取特定键的值
npx wrangler kv:key get --env prod --remote --binding=APP_KV "app:version"

# 设置键值对
npx wrangler kv:key put --env prod --remote --binding=APP_KV "app:version" "1.0.0"

# 删除键
npx wrangler kv:key delete --env prod --remote --binding=APP_KV "app:version"
```

## 高级功能

### 设置元数据和TTL

```bash
# 设置带元数据的键值对
npx wrangler kv:key put --env dev --local --binding=APP_KV "app:config" "{\"name\":\"My App\",\"version\":\"1.0.0\"}" --metadata="{\"contentType\":\"application/json\"}"

# 设置带TTL的键值对（过期时间，以秒为单位）
npx wrangler kv:key put --env dev --local --binding=APP_KV "temp:data" "临时数据" --ttl=3600
```

### 批量操作

#### 导入数据

```bash
# 从JSON文件批量导入键值对
npx wrangler kv:bulk put --env dev --local --binding=APP_KV ./data.json
```

示例 `data.json` 文件格式：

```json
[
  {
    "key": "app:setting:theme",
    "value": "dark",
    "metadata": {
      "description": "UI theme preference",
      "updated": "2023-05-20"
    }
  },
  {
    "key": "app:setting:lang",
    "value": "zh-CN",
    "metadata": {
      "description": "Language preference"
    }
  }
]
```

#### 导出数据

```bash
# 导出所有键值对到JSON文件
npx wrangler kv:bulk get --env dev --local --binding=APP_KV > ./backups/kv-dev-export.json
```

## Dashboard 配置详解

在 Cloudflare Dashboard 中，需要为 Pages 项目绑定 KV 命名空间：

1. 登录 Cloudflare Dashboard
2. 导航至 Pages > 你的项目 > Settings > Functions
3. 找到 "KV namespace bindings" 部分
4. 点击 "Add binding"
5. 配置绑定参数：
   - 变量名：`APP_KV`（必须与 wrangler.toml 中的 binding 名称匹配）
   - 选择已创建的 KV 命名空间
   - 选择适用的环境（Preview、Production 或两者）

## 在代码中使用KV

### 类型定义

```typescript
// 在类型定义中声明KV命名空间
interface Env {
  APP_KV: KVNamespace;
}
```

### 基本操作

```typescript
// 获取值
const version = await env.APP_KV.get('app:version');

// 获取带元数据的值
const { value, metadata } = await env.APP_KV.getWithMetadata('app:config');

// 存储值
await env.APP_KV.put('app:version', '1.1.0');

// 存储带元数据和TTL的值
await env.APP_KV.put('app:config', JSON.stringify({ name: 'My App', version: '1.1.0' }), {
  metadata: { contentType: 'application/json', updated: new Date().toISOString() },
  expirationTtl: 86400 // 24小时
});

// 删除值
await env.APP_KV.delete('temp:data');

// 列出所有键
const keys = await env.APP_KV.list();
```

## 常见问题与解决方案

### 1. KV数据不同步

**问题**: 本地设置的KV值在部署后不可见

**解决方案**:
- 确认使用了正确的环境标识（dev/preview/prod）
- 验证命名空间ID配置正确
- 本地数据不会自动同步到远程，需要在远程环境重新设置

### 2. 绑定错误

**问题**: 代码运行时出现找不到KV绑定的错误

**解决方案**:
- 确保wrangler.toml中的绑定名与代码中使用的名称一致
- 检查Dashboard中的KV绑定设置
- 确认环境参数正确（--env dev/preview/prod）

### 3. JSON值处理

**问题**: 存储或读取JSON数据时出现格式问题

**解决方案**:
- 存储时使用JSON.stringify()序列化
- 读取时使用JSON.parse()反序列化
- 使用--metadata添加content-type元数据
- 使用getWithMetadata()读取带元数据的值

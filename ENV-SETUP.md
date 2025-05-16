# 环境配置和命令结构标准化指南

## 环境标准化

本项目采用三种标准化环境：

| 环境名称 | 环境标识 | 命令参数       | 用途                         |
|----------|----------|----------------|-----------------------------|
| 开发环境 | `dev`    | `--env dev`    | 本地开发，使用本地模拟服务   |
| 预览环境 | `preview`| `--env preview`| 非生产部署，用于测试         |
| 生产环境 | `prod`   | `--env prod`   | 生产环境部署                 |

## 命令结构标准

所有命令遵循统一格式：`{资源}:{环境}:{操作}`

### 资源类型

- `db`: D1 数据库操作
- `kv`: KV 键值存储操作
- `r2`: R2 对象存储操作

### 环境指示符

- `dev`: 开发环境
- `preview`: 预览环境
- `prod`: 生产环境

### 操作类型

根据资源不同而不同，但保持一致性，例如：

- `push`: 应用数据库迁移
- `list`: 列出资源
- `create`: 创建资源
- `check`: 检查资源状态

## 命令示例

```bash
# D1数据库操作
npm run db:dev:push     # 将数据库迁移推送到开发环境
npm run db:preview:push # 将数据库迁移推送到预览环境
npm run db:prod:push    # 将数据库迁移推送到生产环境

# KV键值存储操作
npm run kv:dev:list     # 列出开发环境的所有键
npm run kv:preview:list # 列出预览环境的所有键
npm run kv:prod:list    # 列出生产环境的所有键

# R2对象存储操作
npm run r2:dev:create     # 创建开发环境存储桶
npm run r2:preview:create # 创建预览环境存储桶
npm run r2:prod:create    # 创建生产环境存储桶
```

## 资源命名约定

为保持一致性，我们采用以下命名约定：

### D1 数据库

- 开发环境: `treasure-cave-dev`
- 预览环境: `treasure-cave-preview`
- 生产环境: `treasure-cave`

### KV 命名空间

所有环境使用同一个绑定名 `APP_KV`，但配置不同的命名空间ID。

### R2 存储桶

- 开发环境: `app-files-dev`
- 预览环境: `app-files-preview`
- 生产环境: `app-files-prod`

## 代码中的使用

在代码中，所有环境使用统一的绑定名称，与环境无关：

```typescript
interface Env {
  // D1数据库绑定 - 所有环境通用
  DB: D1Database;
  
  // KV命名空间绑定 - 所有环境通用
  APP_KV: KVNamespace;
  
  // R2存储桶绑定 - 所有环境通用
  APP_FILES: R2Bucket;
}
```

## 环境切换

本地开发时可以使用 `--env` 参数切换环境：

```bash
# 启动本地开发服务器（默认使用开发环境）
npx wrangler dev

# 启动本地开发服务器但连接到预览环境资源
npx wrangler dev --env preview

# 启动本地开发服务器但连接到生产环境资源
npx wrangler dev --env prod
```

## Cloudflare Pages部署

部署到Cloudflare Pages时，使用 `--env` 参数指定环境：

```bash
# 部署到预览环境
wrangler pages deploy ./dist --env preview

# 部署到生产环境
wrangler pages deploy ./dist --env prod
```

## 最佳实践

1. **遵循命名约定**: 始终使用标准化的环境名称(`dev`, `preview`, `prod`)
2. **使用标准命令结构**: 遵循 `{资源}:{环境}:{操作}` 格式
3. **隔离环境资源**: 确保开发、预览和生产环境使用独立的资源
4. **保持绑定名一致**: 在代码中使用相同的绑定名，让配置决定实际使用的资源
5. **明确指定环境**: 在命令中总是明确指定 `--env` 参数，避免默认行为出现问题

# 环境变量设置指南

本项目使用多种环境变量来配置不同环境下的数据库连接和应用设置。

## 设置方法

### 1. 本地开发环境 (.env 文件)

在项目根目录创建 `.env` 文件，包含以下内容：

```
# Cloudflare D1数据库配置
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
CLOUDFLARE_D1_TOKEN=your_api_token

# MySQL数据库配置
DATABASE_URL=mysql://user:password@host:port/database
DATABASE_TYPE=d1
MYSQL_API_URL=http://localhost:3100

# 应用环境配置
NODE_ENV=development
```

### 2. Cloudflare Workers本地开发环境 (.dev.vars)

`.dev.vars` 文件用于 Wrangler 本地开发模式，该文件已经存在于项目中。

### 3. 生产环境

在 Cloudflare Dashboard 中设置环境变量：
1. 登录 Cloudflare Dashboard
2. 导航到您的 Workers & Pages 应用程序
3. 选择 "Settings" > "Variables" 
4. 添加上述环境变量

## 代码中使用环境变量

### Node.js 脚本中

```js
// 引入dotenv加载.env文件
import 'dotenv/config';
// 或在CommonJS中
// require('dotenv').config();

// 使用环境变量
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
```

### Cloudflare Workers中

在 Workers 中可以直接通过 `env` 参数访问环境变量：

```js
export default {
  async fetch(request, env) {
    // 在这里可以使用环境变量
    const databaseType = env.DATABASE_TYPE;
    return new Response('Hello World!');
  }
};
```

## 注意事项

1. 永远不要将包含敏感信息的 `.env` 文件提交到版本控制系统中
2. 该文件已被添加到 `.gitignore` 中
3. 如有必要，可以创建 `.env.example` 作为模板，但不包含实际凭据 
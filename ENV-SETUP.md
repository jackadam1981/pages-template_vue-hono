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
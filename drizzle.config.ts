import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// 注意：请创建.env文件并设置以下环境变量
// CLOUDFLARE_ACCOUNT_ID=your_account_id
// CLOUDFLARE_DATABASE_ID=your_database_id
// CLOUDFLARE_D1_TOKEN=your_api_token

// 如果环境变量不存在，则使用这些默认值（仅用于开发）
const ACCOUNT_ID = '480d718004a1a';
const DATABASE_ID = 'd94b1fc3-282e';
const API_TOKEN = '_ta5TgKZCkvXVQy';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || ACCOUNT_ID,
    databaseId: process.env.PRODUCTION_DATABASE_ID || DATABASE_ID,
    token: process.env.CLOUDFLARE_D1_TOKEN || API_TOKEN,
  },
  introspect: {
    casing: "camel",
  },
  breakpoints: true,
  verbose: true,
  strict: true,
});
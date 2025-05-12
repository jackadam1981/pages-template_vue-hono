import { defineConfig } from 'drizzle-kit';
import { resolve } from 'path';

// 本地SQLite数据库路径
const dbPath = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/cb94b0c3c7e1fca652466153da6bc0f3222f5becdf3c680776c696735afe69cd.sqlite');

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'sqlite',
  // 可能不需要特定的driver字段
  dbCredentials: {
    url: `file:${dbPath}`,
  },
  introspect: {
    casing: "camel",
  },
  breakpoints: true,
  verbose: true,
  strict: true,
}); 
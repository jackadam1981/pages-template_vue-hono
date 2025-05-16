import { defineConfig } from 'drizzle-kit';
import { resolve } from 'path';

/**
 * 开发环境(dev)的Drizzle配置
 * 用于Studio可视化和连接本地SQLite数据库
 */

// 本地SQLite数据库路径
const dbPath = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/a5f941247461102aaa24df43ff942b8f4d977d2f3ce9996b1c87319c8c4e6e5f.sqlite');

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
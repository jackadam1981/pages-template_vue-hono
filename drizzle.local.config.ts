import { defineConfig } from 'drizzle-kit';
import { resolve } from 'path';

// 本地SQLite数据库路径
const dbPath = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/40347cc217fa441ffa565078cfb9bcd0c3c2f2dac3d2df73ceaf24617a0151ac.sqlite');

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
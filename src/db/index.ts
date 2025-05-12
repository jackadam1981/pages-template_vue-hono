import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema/index';

// D1数据库连接函数
export function getD1DB(env: any) {
  // 确保D1数据库绑定存在
  if (!env.DB) {
    throw new Error('D1数据库绑定未配置。请检查wrangler.toml配置。');
  }

  // 创建并返回D1数据库连接
  return drizzle(env.DB, { schema });
}

// 导出所有模式
export { schema }; 
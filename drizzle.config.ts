import { defineConfig } from 'drizzle-kit';

/**
 * 通用 Drizzle 配置文件
 * 用于生成迁移文件
 * 所有环境（开发、预览、生产）共用此配置生成迁移
 */
export default defineConfig({
  // 迁移输出目录 - 所有环境共用
  out: './drizzle',
  // 数据库模式定义目录
  schema: './src/db/schema',
  // 使用 SQLite 数据库类型
  dialect: 'sqlite',
  // 不需要连接信息，因为这只是用于生成迁移文件
  // 而不是执行查询
  verbose: true,
  strict: true,
}); 
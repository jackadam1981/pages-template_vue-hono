import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 系统配置表
export const systemConfig = sqliteTable('system_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),  // 配置项名称
  value: text('value').notNull(), // 配置项值
  description: text('description'), // 配置项描述
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

// 系统日志表
export const systemLog = sqliteTable('system_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: text('level').notNull(), // 日志等级
  message: text('message').notNull(), // 日志消息
  context: text('context'), // JSON 字符串
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

// 备份记录表
export const backupLog = sqliteTable('backup_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileName: text('file_name').notNull(), // 文件名
  backupTime: integer('backup_time', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`), // 备份时间
  operator: text('operator'),
})
#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'

// 检查是否传入 --remote 参数
const isRemote = process.argv.includes('--remote')
const wranglerTarget = isRemote ? '--remote' : '--local'

console.log(`[DEBUG] Running in ${isRemote ? 'remote' : 'local'} mode`)

// 1. 查询所有表名（排除 sqlite 内部表）
const queryCmd = `wrangler d1 execute DB ${wranglerTarget} --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"`
console.log('[DEBUG] Running command:', queryCmd)
const result = execSync(queryCmd).toString()
console.log('[DEBUG] Raw wrangler output:\n', result)
const match = result.match(/\[.*\]/s)
if (!match) {
  console.log('[DEBUG] No JSON array found in wrangler output. No tables found.')
  process.exit(0)
}
let tableList
try {
  tableList = JSON.parse(match[0])
  console.log('[DEBUG] Parsed table list:', tableList)
} catch (e) {
  console.error('[ERROR] Failed to parse table list JSON:', e)
  process.exit(1)
}
// 修正：取 results 数组，并跳过 _cf_ 系统表
const tables = (tableList[0]?.results || [])
  .map((row: any) => row.name)
  .filter((name: string) => !name.startsWith('_cf_'))
console.log('[DEBUG] Final table names (excluding _cf_ system tables):', tables)
if (tables.length === 0) {
  console.log('No tables to drop.')
  process.exit(0)
}

// 2. 生成 DROP 语句
const dropSql = tables.map((name: string) => `DROP TABLE IF EXISTS \`${name}\`;`).join('\n')
console.log('Generated DROP SQL:\n', dropSql)

// 3. 写入临时 SQL 文件
const tmpFile = './backups/clear-all-tables.sql'
fs.writeFileSync(tmpFile, dropSql)

// 4. 执行 DROP 语句
const execDropCmd = `wrangler d1 execute DB ${wranglerTarget} --file=${tmpFile}`
console.log('[DEBUG] Executing drop SQL file:', execDropCmd)
execSync(execDropCmd, { stdio: 'inherit' })

console.log('All tables dropped.')

// 5. 删除临时 SQL 文件
fs.unlinkSync(tmpFile)
console.log('Temporary SQL file deleted.')
    

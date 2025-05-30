#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'

// 检查是否传入 --remote 参数
const isRemote = process.argv.includes('--remote')

// 检查是否有环境参数 (--env dev, --env preview 或 --env prod)
const envIndex = process.argv.indexOf('--env')
const envValue = envIndex !== -1 && envIndex < process.argv.length - 1 ? process.argv[envIndex + 1] : 'dev'
const envParam = envValue ? `--env ${envValue}` : '--env dev'

// 验证环境参数
if (!['dev', 'preview', 'prod'].includes(envValue)) {
  console.error(`错误: 环境参数必须是 dev, preview 或 prod，而不是 "${envValue}"`)
  process.exit(1)
}

// 构建wrangler命令参数
const wranglerTarget = isRemote ? '--remote' : '--local'

console.log(`[DEBUG] Running in ${isRemote ? 'remote' : 'local'} mode, environment: ${envValue}`)

// 确保backups目录存在
if (!fs.existsSync('./backups')) {
  fs.mkdirSync('./backups', { recursive: true });
}

// 1. 查询所有表名（排除 _cf_ 系统表和 sqlite_sequence，但允许 d1_migrations）
const queryCmd = `wrangler d1 execute DB ${wranglerTarget} ${envParam} --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' AND name != 'sqlite_sequence';"`
console.log('[DEBUG] Running command:', queryCmd)

try {
  const result = execSync(queryCmd).toString()
  console.log('[DEBUG] Raw wrangler output:\n', result)

  // 直接提取表名而不是解析JSON
  const tableRegex = /"name":\s*"([^"]+)"/g
  const tables = []
  let match
  while ((match = tableRegex.exec(result)) !== null) {
    const tableName = match[1]
    // 排除 Cloudflare 系统表（_cf_ 开头）和 sqlite_sequence
    if (!tableName.startsWith('_cf_') && tableName !== 'sqlite_sequence') {
      tables.push(tableName)
    }
  }

  console.log('[DEBUG] Final table names to drop (excluding _cf_ tables and sqlite_sequence):', tables)
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
  if (tables.length > 0) {
    const execDropCmd = `wrangler d1 execute DB ${wranglerTarget} ${envParam} --file=${tmpFile}`
    console.log('[DEBUG] Executing drop SQL file:', execDropCmd)
    execSync(execDropCmd, { stdio: 'inherit' })
    console.log('All tables dropped.')
    
    // 5. 如果需要清空 sqlite_sequence（但不删除它），可以执行以下操作
    try {
      const clearSeqCmd = `wrangler d1 execute DB ${wranglerTarget} ${envParam} --command="DELETE FROM sqlite_sequence;"`
      console.log('[DEBUG] Attempting to clear sqlite_sequence table:', clearSeqCmd)
      execSync(clearSeqCmd, { stdio: 'inherit' })
      console.log('Successfully cleared sqlite_sequence table (reset auto-increment counters).')
    } catch (error) {
      console.log('[DEBUG] Error clearing sqlite_sequence table:', error.message)
      console.log('Note: Could not reset auto-increment counters, but tables were still dropped.')
    }
  } else {
    console.log('No tables to drop.')
  }

  // 保留临时SQL文件用于调试
  console.log(`临时SQL文件保存在: ${tmpFile}`)
} catch (error) {
  console.error('执行过程中出错:', error.message)
  
  // 检查是否是权限问题
  if (error.message.includes('permission denied') || error.message.includes('not authorized')) {
    console.error('\n权限错误: 您可能没有足够的权限执行此操作。')
    if (isRemote) {
      console.error('请确保您已使用 wrangler login 登录，并且有权限访问该D1数据库。')
    } else {
      console.error('本地环境出现权限问题，请尝试以管理员权限运行。')
    }
  }
  
  process.exit(1)
}
    

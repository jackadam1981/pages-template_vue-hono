# Cloudflare D1 数据库使用指南

## 环境配置

本项目支持三种环境下的 D1 数据库操作：本地开发环境(Local)、预览环境(Preview)和生产环境(Production)。

### D1 数据库创建

在使用 D1 数据库前，需要创建数据库实例：

```bash
# 创建 D1 数据库
npx wrangler d1 create treasure-cave

# 查看已创建的数据库列表
npm run db:list
# 或直接使用
npx wrangler d1 list
```

创建后，您将获得类似这样的输出：

```
✅ Successfully created DB 'treasure-cave'
Created D1 database treasure-cave with id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 环境配置

项目使用 Cloudflare 的环境配置方式区分不同环境：

1. **本地环境** - 使用 `--local` 标志，访问本地模拟的 D1 数据库
2. **预览环境** - 使用 `--env preview` 标志，访问预览环境配置的数据库
3. **生产环境** - 使用 `--env production` 标志，访问生产环境配置的数据库

在Cloudflare Pages控制台中，您需要为不同环境配置D1绑定：

在 `wrangler.toml`文件中需要为不同环境配置 D1 数据库信息：

```toml
# 默认（开发）环境的D1数据库设置
[[d1_databases]]
binding = "DB"
database_name = "treasure-cave"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
migrations_dir = "./drizzle"

# 预览环境
[env.preview]
[[env.preview.d1_databases]]
binding = "DB"
database_name = "treasure-cave"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
migrations_dir = "./drizzle"

# 生产环境
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "treasure-cave"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
migrations_dir = "./drizzle"
```

> **说明**：以上配置中三个环境使用相同的数据库。如果需要为不同环境使用独立的数据库，只需创建不同的数据库并更新各环境的 `database_id`即可。local可以随意写database_id，preview和production使用远程云D1数据库，应创建两个D1数据库，并配置。

## Drizzle 配置文件

不同环境使用不同的 Drizzle 配置文件：

- 本地环境: `drizzle.local.config.ts`
- 预览环境: `drizzle.preview.config.ts`
- 生产环境: `drizzle.config.ts`

local需要配置本地数据库文件路径。

由于使用D1 http api，所以需要配置账户ID 数据库ID D1权限token。

使用.env来配置：

  dbCredentials: {

    accountId:process.env.CLOUDFLARE_ACCOUNT_ID||ACCOUNT_ID,

    databaseId:process.env.CLOUDFLARE_DATABASE_ID||DATABASE_ID,

    token:process.env.CLOUDFLARE_D1_TOKEN||API_TOKEN,

  },

## 命令使用说明

### 环境与工具关系

本项目使用两个主要工具操作 D1 数据库：

1. **Wrangler** - Cloudflare 的官方命令行工具，用于管理 D1 数据库

   - `--local` 标志：使用本地模拟的D1环境，而不依赖环境变量
     - 本地数据库存储位置：`.wrangler/state/v3/d1/`
   - `--preview` 标志：使用 `wrangler.toml` 中的环境变量配置预览环境
     - 读取字段：`[vars]` 部分的变量和 `[[d1_databases]]` 部分的配置
   - `--remote` 标志：使用 Cloudflare Pages 控制台配置的环境变量
     - 读取字段：控制台中配置的环境变量和绑定的资源
2. **Drizzle** - ORM 和数据库迁移工具

   - 本地环境：使用 `drizzle.local.config.ts` 配置文件
     - 关键字段：`driver`、`dbCredentials`、`schema`、`out`
   - 预览环境：使用 `drizzle.preview.config.ts` 配置文件
     - 关键字段：与本地环境相同，但连接到预览环境数据库
   - 生产环境：使用 `drizzle.config.ts` 配置文件
     - 关键字段：与本地环境相同，但连接到生产环境数据库

各环境对应的配置源和主要配置：

| 环境     | 命令标志      | 配置来源                   | Drizzle 配置文件              | 主要配置字段                                                            |
| -------- | ------------- | -------------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| 本地环境 | `--local`   | wrangler本地模拟           | `drizzle.local.config.ts`   | 不依赖环境变量，使用本地SQLite文件                                      |
| 预览环境 | `--preview` | `wrangler.toml` 中的配置 | `drizzle.preview.config.ts` | `[[d1_databases]]` 的 `binding`, `database_name`, `database_id` |
| 生产环境 | `--remote`  | Cloudflare Pages 控制台    | `drizzle.config.ts`         | Pages 控制台中的环境变量和 D1 绑定                                      |

### 配置文件示例

#### `.env` 或 `.dev.vars` 示例

```
D1_DATABASE_NAME=treasure-cave
D1_DATABASE_ID=xxxxx-xxxx-xxxx-xxxx-xxxxxxxx
```

#### `wrangler.toml` 示例

```toml
name = "my-vue-app"

# D1 数据库配置
[[d1_databases]]
binding = "DB"         # 代码中使用的数据库绑定名称
database_name = "treasure-cave"
database_id = "xxxxx-xxxx-xxxx-xxxx-xxxxxxxx"
```

#### `drizzle.local.config.ts` 示例

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxx/db.sqlite',
  },
});
```

#### `drizzle.preview.config.ts` 示例

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema',
  out: './migrations',
  dialect: 'sqlite', // 使用兼容的数据库类型
  dbCredentials: {
    url: 'file:./preview-database.sqlite', // 使用SQLite文件作为预览环境
  },
  introspect: {
    casing: "camel",
  },
  breakpoints: true,
  verbose: true,
  strict: true,
});
```

> **说明**：当前Drizzle Kit的配置使用SQLite作为预览环境数据库。这是因为Drizzle Kit目前对D1的直接支持有限，我们使用SQLite作为兼容方案。在实际应用中，预览环境的API调用仍然会连接到Cloudflare D1，但Drizzle Studio则通过SQLite文件查看数据库结构。

#### `drizzle.config.ts` 示例

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.toml',
    dbName: 'DB',
    remote: true, // 指定使用远程生产环境
  },
});
```

### Drizzle 配置说明

对于 Drizzle Kit，需要在 `drizzle.preview.config.ts` 中配置以下环境变量才能连接到预览环境：

```bash
# .env 文件中需要添加（用于Drizzle工具连接D1）
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
CLOUDFLARE_D1_TOKEN=your_api_token
```

您可以在 Cloudflare 仪表板中获取这些值：

1. `CLOUDFLARE_ACCOUNT_ID` - 在 Cloudflare 仪表板右侧找到的账户ID
2. `CLOUDFLARE_DATABASE_ID` - 创建 D1 数据库后得到的数据库ID
3. `CLOUDFLARE_D1_TOKEN` - 从 Cloudflare 仪表板的 "API Tokens" 中创建，需要有 D1 的读写权限

这些凭据仅用于 Drizzle Kit 工具（如 `drizzle-kit studio`）通过 HTTP API 连接到 D1 数据库。在实际应用部署中，应用程序会通过 Cloudflare 的内部绑定自动连接。

### 本地环境 (Local)

```bash
# 应用数据库迁移
# 将 Drizzle 生成的迁移应用到本地 D1 数据库
npm run db:local:push
# 完整命令: wrangler d1 migrations apply treasure-cave --local

# 检查数据库表
# 执行 SQL 查询检查本地数据库中的表
npm run db:local:check
# 完整命令: wrangler d1 execute DB --local --command="SELECT name FROM sqlite_master WHERE type='table'"

# 导出数据库到SQL文件
# 将本地数据库导出到 SQL 文件以备份
npm run db:local:export
# 完整命令: wrangler d1 export DB --local --output=./backups/local-export.sql

# 清空所有表
# 使用脚本清空本地数据库中的所有表
npm run db:local:clear
# 完整命令: tsx scripts/clear-all-tables.ts

# 从SQL文件导入数据
# 从 SQL 文件恢复数据到本地数据库
npm run db:local:import
# 完整命令: wrangler d1 execute DB --local --file=./backups/local-export.sql

# 启动Drizzle Studio查看/管理数据
# 启动 Drizzle Studio 图形界面管理本地数据库
npm run db:local:studio
# 完整命令: npx drizzle-kit studio --config=drizzle.local.config.ts
```

### 预览环境 (Preview)

```bash
# 应用数据库迁移
# 将 Drizzle 生成的迁移应用到预览环境 D1 数据库
npm run db:preview:push
# 完整命令: wrangler d1 migrations apply treasure-cave --env preview

# 检查数据库表
# 执行 SQL 查询检查预览环境数据库中的表
npm run db:preview:check
# 完整命令: wrangler d1 execute DB --env preview --command="SELECT name FROM sqlite_master WHERE type='table'"

# 导出数据库到SQL文件
# 将预览环境数据库导出到 SQL 文件以备份
npm run db:preview:export
# 完整命令: wrangler d1 export DB --env preview --output=./backups/preview-export.sql

# 清空所有表
# 使用脚本清空预览环境数据库中的所有表
npm run db:preview:clear
# 完整命令: tsx scripts/clear-all-tables.ts --env preview

# 从SQL文件导入数据
# 从 SQL 文件恢复数据到预览环境数据库
npm run db:preview:import
# 完整命令: wrangler d1 execute DB --env preview --file=./backups/preview-export.sql

# 启动Drizzle Studio查看/管理数据
# 启动 Drizzle Studio 图形界面管理预览环境数据库
npm run db:preview:studio
# 完整命令: npx drizzle-kit studio --config=drizzle.preview.config.ts
```

### 生产环境 (Production)

```bash
# 应用数据库迁移
# 将 Drizzle 生成的迁移应用到生产环境 D1 数据库
npm run db:remote:push
# 完整命令: wrangler d1 migrations apply treasure-cave --env production

# 检查数据库表
# 执行 SQL 查询检查生产环境数据库中的表
npm run db:remote:check
# 完整命令: wrangler d1 execute DB --env production --command="SELECT name FROM sqlite_master WHERE type='table'"

# 导出数据库到SQL文件
# 将生产环境数据库导出到 SQL 文件以备份
npm run db:remote:export
# 完整命令: wrangler d1 export DB --env production --output=./backups/remote-export.sql

# 清空所有表
# 使用脚本清空生产环境数据库中的所有表
npm run db:remote:clear
# 完整命令: tsx scripts/clear-all-tables.ts --env production

# 从SQL文件导入数据
# 从 SQL 文件恢复数据到生产环境数据库
npm run db:remote:import
# 完整命令: wrangler d1 execute DB --env production --file=./backups/remote-export.sql

# 启动Drizzle Studio查看/管理数据
# 启动 Drizzle Studio 图形界面管理生产环境数据库
npm run db:remote:studio
# 完整命令: npx drizzle-kit studio --config=drizzle.config.ts

# 备份数据库(创建时间点恢复书签)
# 创建数据库时间点恢复书签，便于之后恢复
npm run db:remote:backup
# 完整命令: wrangler d1 time-travel info treasure-cave > ./backups/remote-[timestamp].bookmark

# 恢复最近的备份
# 使用最近的书签恢复数据库到之前的状态
npm run db:remote:restore
# 完整命令: PowerShell 脚本查找最新备份并执行 wrangler d1 time-travel restore 命令
```

## 环境切换

在 `db.config.ts` 文件中，系统会根据环境变量自动检测当前环境:

```typescript
// 环境检测逻辑
export const ENV = {
  isDev: process.env.NODE_ENV === 'development',
  isPreview: process.env.CF_PAGES_BRANCH !== 'main' && process.env.CF_PAGES_BRANCH !== undefined,
  isProd: process.env.CF_PAGES_BRANCH === 'main',
};
```

## 注意事项

1. 确保在使用前已创建 D1 数据库: `npx wrangler d1 create treasure-cave`
2. 首次使用前需要应用迁移:
   - 本地环境: `npm run db:local:push`
   - 预览环境: `npm run db:preview:push`
   - 生产环境: `npm run db:remote:push`
3. 环境区分:
   - 本地环境: 使用 `--local` 标志
   - 预览环境: 使用 `--env preview` 标志
   - 生产环境: 使用 `--env production` 标志
4. 预览环境对应于非主分支的部署，生产环境对应于主分支(main)的部署
5. Drizzle Studio 需要配置相应的环境变量才能连接到远程数据库
6. 需要在 wrangler.toml 文件中正确配置每个环境的数据库设置

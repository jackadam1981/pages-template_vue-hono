# Cloudflare D1 数据库使用指南

## 目录

- [环境概述](#环境概述)
- [D1 数据库创建](#d1-数据库创建)
- [环境配置](#环境配置)
- [Drizzle 配置文件](#drizzle-配置文件)
- [命令使用说明](#命令使用说明)
- [Dashboard 配置详解](#dashboard-配置详解)
- [常见问题与解决方案](#常见问题与解决方案)

## 环境概述

本项目支持三种标准化环境的 D1 数据库操作：

| 环境名称 | 环境标识 | 命令前缀  | 说明                                           |
|----------|----------|-----------|------------------------------------------------|
| 开发环境 | `dev`    | `db:dev:` | 本地开发使用，数据存储在 `.wrangler/state` 目录 |
| 预览环境 | `preview`| `db:preview:` | 对应非主分支部署，用于测试                      |
| 生产环境 | `prod`   | `db:prod:` | 对应主分支部署，生产环境使用                    |

## D1 数据库创建

在使用 D1 数据库前，需要创建数据库实例：

```bash
# 创建 D1 数据库 (预览环境)
npx wrangler d1 create treasure-cave-preview

# 创建 D1 数据库 (生产环境)
npx wrangler d1 create treasure-cave

# 查看已创建的数据库列表
npm run db:list
# 或直接使用
npx wrangler d1 list
```

创建后，您将获得类似这样的输出，请保存数据库 ID：

```
✅ Successfully created DB 'treasure-cave'
Created D1 database treasure-cave with id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 环境配置

项目使用 Cloudflare 的环境配置方式区分不同环境：

1. **开发环境** - 使用 `--local --env dev` 标志，访问本地模拟的 D1 数据库
2. **预览环境** - 使用 `--env preview --remote` 标志，访问预览环境配置的数据库
3. **生产环境** - 使用 `--env prod --remote` 标志，访问生产环境配置的数据库

### wrangler.toml 配置示例

```toml
# 全局配置
name = "my-vue-app"
compatibility_date = "2024-05-16"
main = "functions/api/[[path]].ts"

# 开发环境配置 (dev)
[env.dev]
name = "my-vue-app-dev"

# 开发环境 D1 数据库
[[env.dev.d1_databases]]
binding = "DB"
database_name = "treasure-cave-dev"
database_id = "local-dev-d1"  # 开发环境可以使用任意占位符ID
migrations_dir = "./drizzle"

# 预览环境配置 (preview)
[env.preview]
name = "my-vue-app-preview"

# 预览环境 D1 数据库
[[env.preview.d1_databases]]
binding = "DB"
database_name = "treasure-cave-preview"
database_id = "3b5dbac5-9a63-4c45-a53e-828c73a59360"  # 预览环境数据库ID
migrations_dir = "./drizzle"

# 生产环境配置 (prod)
[env.prod]
name = "my-vue-app"

# 生产环境 D1 数据库
[[env.prod.d1_databases]]
binding = "DB"
database_name = "treasure-cave"
database_id = "d94b1fc3-282e-46dd-81b9-d779a1816597"  # 生产环境数据库ID
migrations_dir = "./drizzle"
```

> **最佳实践**：
> - 为不同环境使用独立的数据库，防止开发/测试影响生产数据
> - 遵循统一的环境命名: dev, preview, prod
> - 保持数据库名称命名一致（开发环境: treasure-cave-dev, 预览环境: treasure-cave-preview, 生产环境: treasure-cave）

## Drizzle 配置文件

项目使用统一的 Drizzle 命名规则：

- 开发环境：`drizzle.dev.config.ts`
- 预览环境：`drizzle.preview.config.ts`
- 生产环境：`drizzle.prod.config.ts`
- 通用迁移生成：`drizzle.config.ts`

### 配置文件说明

#### 迁移生成配置 (`drizzle.config.ts`)

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // 迁移输出目录
  out: './drizzle',
  // 数据库模式定义目录
  schema: './src/db/schema',
  // 使用 SQLite 数据库类型
  dialect: 'sqlite',
  // 不需要连接信息，因为只用于生成迁移
  verbose: true,
  strict: true,
});
```

#### 开发环境配置 (`drizzle.dev.config.ts`)

```typescript
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
```

#### 预览环境配置 (`drizzle.preview.config.ts`)

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * 预览环境(preview)的Drizzle配置
 * 用于Studio可视化和连接预览环境远程D1数据库
 */

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.PREVIEW_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
  introspect: {
    casing: "camel",
  },
  breakpoints: true,
  verbose: true,
  strict: true,
});
```

#### 生产环境配置 (`drizzle.prod.config.ts`)

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * 生产环境(prod)的Drizzle配置
 * 用于Studio可视化和连接生产环境远程D1数据库
 */

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.PRODUCTION_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
  introspect: {
    casing: "camel",
  },
  breakpoints: true,
  verbose: true,
  strict: true,
});
```

### 环境变量配置 (.env 文件)

```
# Cloudflare 账户信息
CLOUDFLARE_ACCOUNT_ID=480d718004a1a3ca022cbd36a0033aab
CLOUDFLARE_D1_TOKEN=_ta5TgKZCkvXVQybYKjcLsAlyb4gpi4kkIQwp056

# 预览数据库ID
PREVIEW_DATABASE_ID=3b5dbac5-9a63-4c45-a53e-828c73a59360

# 生产数据库ID
PRODUCTION_DATABASE_ID=d94b1fc3-282e-46dd-81b9-d779a1816597
```

> **注意**：环境变量仅用于 Drizzle Studio 访问远程数据库。在实际部署中，应用会通过 Cloudflare 的内部绑定自动连接。

## 命令使用说明

### 数据库迁移

```bash
# 生成迁移文件（对所有环境通用）
npm run db:generate

# 应用迁移到各环境
npm run db:dev:push     # 开发环境 (使用 --local --env dev)
npm run db:preview:push # 预览环境 (使用 --env preview --remote)
npm run db:prod:push    # 生产环境 (使用 --env prod --remote)
```

### 数据库管理

```bash
# 检查各环境的数据库表
npm run db:dev:check     # 开发环境
npm run db:preview:check # 预览环境
npm run db:prod:check    # 生产环境

# 清空各环境的数据库表
npm run db:dev:clear     # 开发环境
npm run db:preview:clear # 预览环境
npm run db:prod:clear    # 生产环境

# 导出/导入数据库
npm run db:dev:export     # 导出开发环境数据库
npm run db:preview:export # 导出预览环境数据库
npm run db:prod:export    # 导出生产环境数据库
npm run db:dev:import     # 导入开发环境数据库
npm run db:preview:import # 导入预览环境数据库
npm run db:prod:import    # 导入生产环境数据库

# 使用Drizzle Studio查看各环境数据库
npm run db:dev:studio     # 查看开发环境数据库
npm run db:preview:studio # 查看预览环境数据库
npm run db:prod:studio    # 查看生产环境数据库

# 备份和恢复生产数据库
npm run db:prod:backup    # 创建生产数据库备份点
npm run db:prod:restore   # 恢复最近的生产数据库备份点
```

## Dashboard 配置详解

在 Cloudflare Dashboard 中，需要为 Pages 项目绑定 D1 数据库：

1. 登录 Cloudflare Dashboard
2. 导航至 Pages > 你的项目 > Settings > Functions
3. 找到 "D1 database bindings" 部分
4. 点击 "Add binding"
5. 配置绑定参数：
   - 变量名：`DB`（必须与 wrangler.toml 中的 binding 名称匹配）
   - 选择对应环境的 D1 数据库
     - Preview环境使用 `treasure-cave-preview` 
     - Production环境使用 `treasure-cave`
   - 选择适用的环境（Preview、Production 或两者）

> **注意**：Dashboard 中的绑定会覆盖 wrangler.toml 中的配置。

## 常见问题与解决方案

### 1. 权限问题

**问题**: 执行远程数据库操作时出现 `not authorized` 或 `permission denied` 错误

**解决方案**:
- 确保已登录 `wrangler login`
- 检查账户权限
- 确认数据库ID是否正确

### 2. 找不到本地数据库

**问题**: 执行本地数据库操作时提示找不到数据库文件

**解决方案**:
- 检查 `.wrangler/state` 目录是否存在 
- 先尝试执行 `wrangler dev` 启动本地环境
- 使用 `--persist` 选项确保数据持久化

### 3. 迁移失败

**问题**: 应用迁移时失败

**解决方案**:
- 确认环境参数正确 (--env dev/preview/prod)
- 检查 migrations_dir 路径配置是否正确
- 确保迁移文件格式符合要求

### 4. 数据库ID不匹配

**问题**: 配置的数据库ID与实际不符

**解决方案**:
- 使用 `npm run db:list` 查看实际的数据库ID
- 更新 wrangler.toml 中的对应 database_id
- 检查是否将测试环境ID错误地用于生产环境

### 5. 本地开发时绑定名不匹配

**问题**: 代码中引用的绑定名与配置不一致

**解决方案**:
- 确保代码中使用的绑定名与 wrangler.toml 中的 binding 名称一致
- 默认绑定名为 `DB`，如果修改需同步更新所有引用

## 参考资源

- [Cloudflare D1 官方文档](https://developers.cloudflare.com/d1/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Wrangler 命令行工具](https://developers.cloudflare.com/workers/wrangler/)

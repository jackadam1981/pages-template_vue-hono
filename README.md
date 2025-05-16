# Vue.js + Cloudflare Pages应用

这是一个使用 Vue.js 作为前端，Cloudflare Pages 作为托管平台的应用模板。

集成了Cloudflare的三大核心服务：D1（数据库）、KV（键值存储）和R2（对象存储）。

## 特性

- Vue.js 前端框架
- Cloudflare Pages 作为托管
- Cloudflare D1 (SQLite) 作为数据库
- Cloudflare KV (键值对) 存储应用数据
- Cloudflare R2 (文件和对象存储) 存储图片，文件
- Hono.js 作为 API 框架
- Drizzle ORM 用于数据库交互

## 环境配置

项目配置了三个标准化环境：

- **开发环境** (`dev`): 本地开发，使用本地模拟的 D1/KV/R2 服务
- **预览环境** (`preview`): 部署到 Cloudflare，用于测试和预发布
- **生产环境** (`prod`): 生产环境部署

环境配置位于 `wrangler.toml` 文件中，按环境区分。

## 命令结构

所有命令遵循统一格式：`{资源}:{环境}:{操作}`

例如：
- `db:dev:push` - 将数据库迁移推送到开发环境
- `kv:preview:list` - 列出预览环境的所有KV键
- `r2:prod:create` - 创建生产环境的R2存储桶

## 开发说明

### 环境要求

- Node.js 18+
- npm 9+

### 安装和启动

1. 克隆仓库

```bash
git clone <repository-url>
cd my-vue-app
```

2. 安装依赖

```bash
npm install
```

3. 本地开发

```bash
npm run dev
```

## 数据库操作 (D1)

### 数据库迁移和管理

```bash
# 生成迁移文件（对所有环境通用）
npm run db:generate

# 应用迁移到各环境
npm run db:dev:push     # 开发环境
npm run db:preview:push # 预览环境
npm run db:prod:push    # 生产环境

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
npm run db:dev:import     # 导入开发环境数据库
npm run db:preview:export # 导出预览环境数据库
npm run db:preview:import # 导入预览环境数据库
npm run db:prod:export    # 导出生产环境数据库
npm run db:prod:import    # 导入生产环境数据库

# 使用Drizzle Studio查看各环境数据库
npm run db:dev:studio     # 查看开发环境数据库
npm run db:preview:studio # 查看预览环境数据库
npm run db:prod:studio    # 查看生产环境数据库

# 备份和恢复生产数据库(使用时间旅行)
npm run db:prod:backup    # 创建生产数据库备份点
npm run db:prod:restore   # 恢复最近的生产数据库备份点
```

## KV存储操作

```bash
# 列出所有KV命名空间
npm run kv:list

# 设置KV值（以版本号为例）
npm run kv:dev:set:version     # 开发环境
npm run kv:preview:set:version # 预览环境
npm run kv:prod:set:version    # 生产环境

# 设置JSON配置
npm run kv:dev:set:config     # 开发环境
npm run kv:preview:set:config # 预览环境
npm run kv:prod:set:config    # 生产环境

# 设置临时值(带TTL)
npm run kv:dev:set:temp     # 开发环境
npm run kv:preview:set:temp # 预览环境
npm run kv:prod:set:temp    # 生产环境

# 列出所有键
npm run kv:dev:list     # 开发环境
npm run kv:preview:list # 预览环境
npm run kv:prod:list    # 生产环境
```

## R2对象存储操作

```bash
# 列出所有存储桶
npm run r2:list

# 创建存储桶
npm run r2:dev:create     # 创建开发环境存储桶 (app-files-dev)
npm run r2:preview:create # 创建预览环境存储桶 (app-files-preview)
npm run r2:prod:create    # 创建生产环境存储桶 (app-files-prod)

# 查看存储桶信息
npm run r2:dev:info     # 开发环境存储桶信息
npm run r2:preview:info # 预览环境存储桶信息
npm run r2:prod:info    # 生产环境存储桶信息

# 删除存储桶
npm run r2:dev:delete     # 删除开发环境存储桶
npm run r2:preview:delete # 删除预览环境存储桶
npm run r2:prod:delete    # 删除生产环境存储桶

# 测试R2功能
npm run r2:dev:test       # 测试开发环境R2上传
npm run r2:dev:download   # 测试开发环境R2下载
```

## 部署

```bash
# 构建
npm run build

# 部署到预览环境
wrangler pages deploy ./dist --env preview

# 部署到生产环境
wrangler pages deploy ./dist --env prod
```

## Cloudflare Pages 部署设置

### 绑定服务资源

在 Cloudflare Dashboard 中，你需要为你的 Pages 项目绑定 D1、KV 和 R2 资源，确保应用能访问这些服务。

1. **登录 Cloudflare Dashboard**：
   - 访问 https://dash.cloudflare.com/
   - 选择你的账户和项目

2. **设置 Pages 项目**：
   - 导航到 `Pages` > 你的项目 > `Settings` > `Functions`
   - 找到 `D1 database bindings`、`KV namespace bindings` 和 `R2 bucket bindings` 部分

3. **设置 D1 数据库绑定**：
   - 点击 `Add binding`
   - 变量名：输入 `DB`（必须与 wrangler.toml 中的 binding 名称匹配）
   - 选择对应环境的 D1 数据库：
     - 预览环境: `treasure-cave-preview`
     - 生产环境: `treasure-cave`
   - 勾选对应环境: `Preview` 或/和 `Production`

4. **设置 KV 命名空间绑定**：
   - 点击 `Add binding`
   - 变量名：输入 `APP_KV`（必须与 wrangler.toml 中的 binding 名称匹配）
   - 选择你的 KV 命名空间
   - 勾选对应环境: `Preview` 或/和 `Production`

5. **设置 R2 存储桶绑定**：
   - 点击 `Add binding`
   - 变量名：输入 `APP_FILES`（必须与 wrangler.toml 中的 binding 名称匹配）
   - 选择对应环境的 R2 存储桶：
     - 预览环境: `app-files-preview`
     - 生产环境: `app-files-prod`
   - 勾选对应环境: `Preview` 或/和 `Production`

### 环境变量设置

除了服务绑定，你还可以设置环境变量来控制应用的行为：

1. **导航到环境变量设置**：
   - 在 Pages 项目中，前往 `Settings` > `Environment variables`

2. **添加环境变量**：
   - 点击 `Add variable`
   - 设置关键变量，例如：
     - `ENVIRONMENT`: 设置为 `preview` 或 `prod`
     - 其他应用特定的配置变量

3. **指定环境**：
   - 你可以选择变量适用于 `Production`、`Preview` 或两者都是
   - 这允许你在不同环境中使用不同的配置

### 注意事项

- **绑定名称必须匹配**：Dashboard 中的绑定变量名必须与 `wrangler.toml` 中配置的 `binding` 名称完全一致
- **环境特定配置**：为预览和生产环境配置不同的资源
- **部署后生效**：更改绑定或环境变量后，需要重新部署应用才能生效
- **绑定优先级**：Dashboard 中的绑定会覆盖 `wrangler.toml` 中的同名绑定
- **资源命名一致性**：确保资源名称与wrangler.toml中的配置一致，特别是存储桶名称

## 项目结构

```
.
├── dist/                # 构建输出目录
├── drizzle/             # Drizzle 迁移文件
├── functions/           # Cloudflare Pages 函数
│   └── api/             # API 路由
├── public/              # 静态资源
├── scripts/             # 脚本文件
├── src/                 # 源代码
│   ├── assets/          # 资源文件
│   ├── components/      # Vue 组件
│   └── db/              # 数据库相关
│       └── schema/      # 数据库模式定义
├── backups/             # 数据库备份目录
├── wrangler.toml        # Cloudflare Wrangler 配置
├── drizzle.config.ts    # 通用Drizzle配置（用于生成迁移）
├── drizzle.dev.config.ts    # 开发环境Drizzle配置
├── drizzle.preview.config.ts # 预览环境Drizzle配置
├── drizzle.prod.config.ts    # 生产环境Drizzle配置
└── package.json         # 项目配置
```

## 开发注意事项

1. **本地开发**：
   - 使用命令 `npm run dev` 可以启动本地服务器
   - 本地开发使用 `.wrangler/state` 目录下的模拟服务
   - KV数据存储在 `.wrangler/state/kv` 目录
   - D1数据库存储在 `.wrangler/state/d1` 目录
   - R2对象存储在 `.wrangler/state/r2` 目录

2. **部署流程**：
   - 预览环境：`wrangler pages deploy ./dist --env preview`
   - 生产环境：`wrangler pages deploy ./dist --env prod`

3. **配置说明**：
   - 环境配置位于 `wrangler.toml`
   - 确保各环境的资源ID配置正确
   - 所有命令遵循 `{资源}:{环境}:{操作}` 格式

## 环境要求

- Node.js 18.17.1
- npm 9.6.7

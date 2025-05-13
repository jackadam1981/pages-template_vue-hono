# Vue.js + Cloudflare Pages + D1 应用

这是一个使用 Vue.js 作为前端，Cloudflare Pages 作为托管平台，D1 作为数据库的应用模板。

## 特性

- Vue.js 前端框架
- Cloudflare Pages 作为托管
- Cloudflare D1 (SQLite) 作为数据库 
- Hono.js 作为 API 框架
- Drizzle ORM 用于数据库交互

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

## 数据库配置

本项目使用 Cloudflare D1 数据库，在本地开发环境下可以使用 SQLite 作为替代。

### 数据库迁移

1. 生成迁移文件
```bash
npm run db:generate
```

2. 应用迁移到本地数据库
```bash
npm run db:migrate:local
```

3. 填充测试数据
```bash
npm run db:seed
```

4. 一步完成设置（生成、迁移、填充）
```bash
npm run db:setup
```

### 部署到 Cloudflare D1

1. 创建 D1 数据库（仅需执行一次）
```bash
wrangler d1 create my-database
```

2. 将数据库 ID 更新到 `wrangler.toml` 文件中

3. 应用迁移到 D1 数据库
```bash
npm run db:push:d1
```

## API 说明

系统包含以下 API 端点：

- `/api` - API 信息
- `/api/hello` - 测试接口
- `/api/env` - 环境信息
- `/api/config` - 系统配置
- `/api/tables` - 数据库表列表
- `/api/tables/:tableName/data` - 指定表的数据

## 部署

```bash
npm run deploy
```

这将构建前端应用并部署到 Cloudflare Pages。

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
├── wrangler.toml        # Cloudflare Wrangler 配置
└── package.json         # 项目配置
```

## pages要求
node:18.17.1
npm:9.6.7


npm install hono --save-dev


## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```


https://developers.cloudflare.com/pages/framework-guides/deploy-a-vue-site/

npm create cloudflare@latest -- my-vue-app --framework=vue --platform=pages


git config --global user.email "jackadam1981@hotmail.com"
git config --global user.name "jack"

echo "# pages-template_vue-hono" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/jackadam1981/pages-template_vue-hono.git
git push -u origin main

Download and install the latest Microsoft Visual C++ Redistributable package. You can get it from the official Microsoft website:
Visit: https://aka.ms/vs/17/release/vc_redist.x64.exe
This will download the latest Visual C++ Redistributable for x64 systems

本地开发：
开发者复制 wrangler.example.toml 为 wrangler.toml
填入本地开发用的数据库 ID
使用 wrangler dev 进行本地开发
生产部署：
在 Cloudflare Dashboard 的 Pages 设置中配置数据库绑定
使用 wrangler pages deploy 部署
生产环境的数据库 ID 完全通过 Dashboard 管理


.dev.vars 文件与 .env 文件略有不同:
.dev.vars - 这是 Cloudflare Wrangler 使用的本地开发环境变量文件，专门用于 Wrangler 的本地开发服务器。当您运行 wrangler dev 或 wrangler pages dev 命令时，Wrangler 会读取这个文件中的环境变量。
.env - 这是一个更通用的环境变量文件，被 dotenv 库读取，用于 Node.js 应用程序。您的 drizzle.config.ts 文件导入了 dotenv/config，所以它会从这个文件中读取变量。
您在不同情况下需要两个文件:
当您使用 Drizzle Kit 工具（如 drizzle-kit studio）时，它会读取 .env 文件
当您使用 Wrangler 命令（如 wrangler pages dev）时，它会读取 .dev.vars 文件
所以两个文件都有各自的用途，取决于您使用的工具。建议您保留 .dev.vars 文件，并根据需要更新其中的内容。


当您运行 wrangler pages dev 或 wrangler dev 命令时：
自动使用 preview_id：
Wrangler 会自动使用 wrangler.toml 中配置的 preview_id 对应的 KV 命名空间
它不会使用生产环境的 KV ID（即 id 字段指定的）
这是 Wrangler 的设计决策，目的是防止开发环境意外修改生产环境数据
无法在开发模式直接使用生产 KV：
没有内置的方法直接让 wrangler dev 使用生产环境的 KV ID
这是有意为之，作为一种安全措施

KV说明
"kv:list-namespaces"  列出所有KV命名空间

对于KV命令，实际上有三个不同的操作环境：
本地环境 (--local):
在本地.wrangler/state目录中操作数据
用于本地开发和测试
命令: kv:local:*
预览环境 (--preview):
使用预览KV命名空间ID (preview_id)
在Cloudflare云端，但为开发用途保留
命令: kv:preview:*
生产环境 (--preview false --remote):
使用生产KV命名空间ID (id)
Cloudflare云端的真正生产数据
命令: kv:deployset:* 和 kv:deploy:*
现在我已经添加了所有三种环境的命令，并使用了正确的标志组合：
本地环境: --preview false --local --binding=APP_KV
预览环境: --preview --binding=APP_KV
生产环境: --preview false --remote --binding=APP_KV
这样就可以明确区分所有操作环境，避免意外修改错误的数据。特别是生产环境命令现在添加了--remote标志，确保操作的是Cloudflare云端的KV存储，而不是本地实例。
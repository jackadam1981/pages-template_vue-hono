# Cloudflare R2 存储使用指南

## 目录

- [环境概述](#环境概述)
- [R2 存储桶创建](#r2-存储桶创建)
- [环境配置](#环境配置)
- [命令使用说明](#命令使用说明)
- [API 操作](#api-操作)
- [Dashboard 配置详解](#dashboard-配置详解)
- [常见问题与解决方案](#常见问题与解决方案)

## 环境概述

本项目支持三种标准化环境的 R2 (对象存储) 操作：

| 环境名称 | 环境标识 | 命令前缀  | 存储桶命名        | 说明                     |
|----------|----------|-----------|-------------------|--------------------------|
| 开发环境 | `dev`    | `r2:dev:` | `app-files-dev`   | 本地开发使用的远程存储桶 |
| 预览环境 | `preview`| `r2:preview:` | `app-files-preview` | 预览环境使用的存储桶     |
| 生产环境 | `prod`   | `r2:prod:` | `app-files-prod`   | 生产环境使用的存储桶     |

## R2 存储桶创建

在使用 R2 前，需要创建存储桶：

```bash
# 创建各环境存储桶
npm run r2:dev:create     # 创建开发环境存储桶 (app-files-dev)
npm run r2:preview:create # 创建预览环境存储桶 (app-files-preview)
npm run r2:prod:create    # 创建生产环境存储桶 (app-files-prod)

# 查看已创建的存储桶列表
npm run r2:list
# 或直接使用
npx wrangler r2 bucket list
```

创建后，您将获得类似这样的输出：

```
Created bucket app-files-dev
```

## 环境配置

项目使用 Cloudflare 的环境配置方式区分不同环境：

1. **开发环境** - 使用 `--env dev` 标志，访问开发环境的R2存储桶
2. **预览环境** - 使用 `--env preview` 标志，访问预览环境的R2存储桶
3. **生产环境** - 使用 `--env prod` 标志，访问生产环境的R2存储桶

### wrangler.toml 配置示例

```toml
# 全局配置
name = "my-vue-app"
compatibility_date = "2024-05-16"
main = "functions/api/[[path]].ts"

# 开发环境配置 (dev)
[env.dev]
name = "my-vue-app-dev"

# 开发环境 R2 存储桶
[[env.dev.r2_buckets]]
binding = "APP_FILES"
bucket_name = "app-files-dev"

# 预览环境配置 (preview)
[env.preview]
name = "my-vue-app-preview"

# 预览环境 R2 存储桶
[[env.preview.r2_buckets]]
binding = "APP_FILES"
bucket_name = "app-files-preview"

# 生产环境配置 (prod)
[env.prod]
name = "my-vue-app"

# 生产环境 R2 存储桶
[[env.prod.r2_buckets]]
binding = "APP_FILES"
bucket_name = "app-files-prod"
```

> **最佳实践**：
> - 为不同环境使用独立的R2存储桶，防止开发/测试影响生产数据
> - 遵循统一的环境命名: dev, preview, prod
> - 遵循统一的存储桶命名规则: app-files-dev, app-files-preview, app-files-prod

## 命令使用说明

### 存储桶管理

```bash
# 列出所有存储桶
npm run r2:list

# 创建存储桶
npm run r2:dev:create     # 创建开发环境存储桶
npm run r2:preview:create # 创建预览环境存储桶
npm run r2:prod:create    # 创建生产环境存储桶

# 查看存储桶信息
npm run r2:dev:info     # 开发环境存储桶信息
npm run r2:preview:info # 预览环境存储桶信息
npm run r2:prod:info    # 生产环境存储桶信息

# 删除存储桶
npm run r2:dev:delete     # 删除开发环境存储桶
npm run r2:preview:delete # 删除预览环境存储桶
npm run r2:prod:delete    # 删除生产环境存储桶
```

### 对象操作

直接使用 wrangler 命令操作对象：

```bash
# 上传文件到开发环境
npx wrangler r2 object put --env dev app-files-dev/example.json --file=./path/to/example.json --content-type=application/json

# 上传文件到预览环境
npx wrangler r2 object put --env preview app-files-preview/example.json --file=./path/to/example.json --content-type=application/json

# 上传文件到生产环境
npx wrangler r2 object put --env prod app-files-prod/example.json --file=./path/to/example.json --content-type=application/json

# 下载文件
npx wrangler r2 object get --env dev app-files-dev/example.json --file=./downloaded-example.json

# 删除文件
npx wrangler r2 object delete --env dev app-files-dev/example.json
```

### 测试脚本

项目还提供测试脚本来验证 R2 功能：

```bash
# 测试开发环境 R2 上传
npm run r2:dev:test

# 测试开发环境 R2 下载
npm run r2:dev:download

# 测试开发环境 R2 删除
npm run r2:dev:delete
```

## API 操作

项目提供了完整的 RESTful API 来操作 R2 对象存储：

### 列出所有文件

```http
GET /api/files
```

示例响应:

```json
{
  "success": true,
  "files": [
    { "name": "example.json", "size": 1024, "uploaded": "2024-05-13T12:00:00.000Z" },
    { "name": "image.png", "size": 5120, "uploaded": "2024-05-13T12:30:00.000Z" }
  ],
  "count": 2,
  "timestamp": "2024-05-13T13:00:00.000Z"
}
```

### 上传文件

```http
PUT /api/files/filename
Content-Type: application/json (或其他适当的内容类型)

<文件内容>
```

示例：

```bash
curl -X PUT -H "Content-Type: application/json" \
  --data-binary @example.json \
  http://localhost:8976/api/files/example.json
```

### 下载文件

```http
GET /api/files/filename
```

示例：

```bash
# 下载文件
curl http://localhost:8976/api/files/example.json -o downloaded.json

# 获取文件元数据（不下载内容）
curl -H "Accept: application/json" http://localhost:8976/api/files/example.json
```

### 删除文件

```http
DELETE /api/files/filename
```

示例：

```bash
curl -X DELETE http://localhost:8976/api/files/example.json
```

## Dashboard 配置详解

在 Cloudflare Dashboard 中，需要为 Pages 项目绑定 R2 存储桶：

1. 登录 Cloudflare Dashboard
2. 导航至 Pages > 你的项目 > Settings > Functions
3. 找到 "R2 bucket bindings" 部分
4. 点击 "Add binding"
5. 配置绑定参数：
   - 变量名：`APP_FILES`（必须与 wrangler.toml 中的 binding 名称匹配）
   - 选择对应环境的 R2 存储桶：
     - Preview环境使用 `app-files-preview` 
     - Production环境使用 `app-files-prod`
   - 选择适用的环境（Preview、Production 或两者）

> **注意**：Dashboard 中的绑定会覆盖 wrangler.toml 中的配置。

## 在代码中使用R2

### 类型定义

```typescript
// 在类型定义中声明R2存储桶
interface Env {
  APP_FILES: R2Bucket;
}
```

### 基本操作

```typescript
// 上传文件
await env.APP_FILES.put('example.json', JSON.stringify({ hello: 'world' }), {
  httpMetadata: { contentType: 'application/json' },
});

// 获取文件
const file = await env.APP_FILES.get('example.json');
if (file) {
  const data = await file.json();
  // 使用文件数据...
}

// 获取文件元数据
const obj = await env.APP_FILES.head('example.json');
if (obj) {
  console.log('文件大小:', obj.size);
  console.log('上传时间:', obj.uploaded);
}

// 删除文件
await env.APP_FILES.delete('example.json');

// 列出文件
const listed = await env.APP_FILES.list({ prefix: 'folder/' });
for (const object of listed.objects) {
  console.log(object.key, object.size);
}
```

## 常见问题与解决方案

### 1. 存储桶命名冲突

**问题**: 创建存储桶时出现"名称已被使用"错误

**解决方案**:
- 存储桶名称在所有Cloudflare账户中必须唯一
- 尝试使用更具体的前缀，如公司名或项目名
- 检查是否已创建同名存储桶 (`npm run r2:list`)

### 2. 绑定错误

**问题**: 代码运行时出现找不到R2绑定的错误

**解决方案**:
- 确保wrangler.toml中的绑定名与代码中使用的名称一致
- 检查Dashboard中的R2绑定设置
- 确保已创建对应环境的存储桶

### 3. 内容类型问题

**问题**: 上传的文件下载后内容类型不正确

**解决方案**:
- 上传时明确指定content-type
- 确保API中设置了正确的Content-Type响应头
- 使用httpMetadata选项设置内容类型

## R2与其他存储的比较

| 特性         | R2 对象存储                | KV 存储                  | D1 数据库               |
|--------------|----------------------------|--------------------------|--------------------------|
| 适用场景     | 大文件、媒体、备份         | 小型配置、会话数据       | 结构化数据、关系数据    |
| 大小限制     | 单文件可达数GB             | 单值最大25MB             | 每个数据库最大5GB       |
| 查询能力     | 基于键、前缀和标签         | 仅基于键                 | 完整SQL查询支持         |
| 本地开发     | 需远程桶，无完全本地模拟   | 本地模拟存储             | 本地SQLite模拟          |
| 建议用途     | 图片、视频、文档、归档     | 配置、特性标志、缓存     | 用户数据、交易、关系数据|

希望这份指南能帮助您有效地使用 R2 存储！

在R2存储中，我们确实考虑了三种环境场景，与KV存储类似：

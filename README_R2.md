# Cloudflare R2 存储使用指南

本项目集成了 Cloudflare R2 对象存储服务，用于存储和管理文件。下面是使用说明。

R2和 D1 KV不一样，由于是存储桶，只能远程使用云上资源。

但是我们可以使用3个存储桶来处理本地开发，远程预览，远程生产。


## 1. 命令行操作

### 存储桶管理

```bash
# 列出所有存储桶
npm run r2:list-buckets

# 创建生产环境存储桶
npm run r2:create-bucket

# 创建预览/开发环境存储桶
npm run r2:create-preview-bucket
```

### 对象操作

注意：wrangler CLI 不支持直接列出对象，请使用 API 查看对象列表。

```bash
# 上传文件
npx wrangler r2 object put app-files/example.json --file=./path/to/example.json --content-type=application/json

# 下载文件
npx wrangler r2 object get app-files/example.json --file=./downloaded-example.json

# 删除文件
npx wrangler r2 object delete app-files/example.json
```

## 2. API 操作

我们提供了完整的 RESTful API 来操作 R2 对象存储：

### 列出所有文件

```
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

```
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

```
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

```
DELETE /api/files/filename
```

示例：

```bash
curl -X DELETE http://localhost:8976/api/files/example.json
```

## 3. 本地开发、生产预览、生产环境

使用 wrangler.toml 配置的三个不同存储桶：

- 本地开发：`app-files-dev`
- 生产预览：`app-files-pre`
- 生产预览：`app-files`

在本地开发时，将使用 `app-files-dev`存储桶，而在生产环境中将使用 `app-files`。

## 注意事项

1. 文件上传需要指定正确的 Content-Type 以确保文件被正确解释
2. R2 存储适合存储大型文件，相比 KV 更适合以下场景：
   - 图片、音频、视频等媒体文件
   - 大型数据集和文档
   - 存档和备份文件
3. API 提供了对象的元数据，如大小、上传时间和 ETag
4. 所有文件都有一年的缓存时间，可在代码中按需调整

希望这份指南能帮助您有效地使用 R2 存储！

在R2存储中，我们确实考虑了三种环境场景，与KV存储类似：

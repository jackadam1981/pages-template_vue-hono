
# Cloudflare KV 存储使用指南

## 环境配置

Cloudflare KV (Key-Value) 存储支持三种环境：本地开发环境(Local)、预览环境(Preview)和生产环境(Production)。

### KV 命名空间创建

在使用 KV 前，需要创建命名空间：

**bash**

复制

下载

```
# 创建 KV 命名空间
npx wrangler kv:namespace create TREASURE_CAVE

# 查看已创建的命名空间列表
npx wrangler kv:namespace list
```

创建后，您将获得类似这样的输出：

复制

下载

```
✅ Successfully created KV namespace with id "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 环境配置

在 `wrangler.toml` 文件中配置 KV 命名空间：

**toml**

复制

下载

```
# 默认（开发）环境的KV配置
[[kv_namespaces]]
binding = "TREASURE_CAVE"  # 代码中使用的绑定名称
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 命名空间ID
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"  # 预览环境命名空间ID

# 预览环境
[env.preview]
[[env.preview.kv_namespaces]]
binding = "TREASURE_CAVE"
id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"

# 生产环境
[env.production]
[[env.production.kv_namespaces]]
binding = "TREASURE_CAVE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> **注意** ：建议为开发、预览和生产环境使用不同的命名空间，以避免数据冲突。

## 基本操作命令

### 本地开发环境

**bash**

复制

下载

```
# 列出本地KV命名空间中的所有键
npx wrangler kv:key list --binding TREASURE_CAVE --local

# 获取特定键的值
npx wrangler kv:key get --binding TREASURE_CAVE "key-name" --local

# 设置键值对
npx wrangler kv:key put --binding TREASURE_CAVE "key-name" "value" --local

# 删除键
npx wrangler kv:key delete --binding TREASURE_CAVE "key-name" --local
```

### 预览环境

**bash**

复制

下载

```
# 列出预览环境KV命名空间中的所有键
npx wrangler kv:key list --binding TREASURE_CAVE --preview

# 获取特定键的值
npx wrangler kv:key get --binding TREASURE_CAVE "key-name" --preview

# 设置键值对
npx wrangler kv:key put --binding TREASURE_CAVE "key-name" "value" --preview

# 删除键
npx wrangler kv:key delete --binding TREASURE_CAVE "key-name" --preview
```

### 生产环境

**bash**

复制

下载

```
# 列出生产环境KV命名空间中的所有键
npx wrangler kv:key list --binding TREASURE_CAVE

# 获取特定键的值
npx wrangler kv:key get --binding TREASURE_CAVE "key-name"

# 设置键值对
npx wrangler kv:key put --binding TREASURE_CAVE "key-name" "value"

# 删除键
npx wrangler kv:key delete --binding TREASURE_CAVE "key-name"
```

## 批量操作

### 导入数据

**bash**

复制

下载

```
# 从JSON文件批量导入键值对
npx wrangler kv:bulk put --binding TREASURE_CAVE ./data.json
```

示例 `data.json` 文件格式：

**json**

复制

下载

```
[
  {
    "key": "key1",
    "value": "value1"
  },
  {
    "key": "key2",
    "value": "value2"
  }
]
```

### 导出数据

**bash**

复制

下载

```
# 导出所有键值对到JSON文件
npx wrangler kv:bulk get --binding TREASURE_CAVE > ./export.json
```

## 在Worker/Pages中使用KV

### TypeScript 类型定义

**typescript**

复制

下载

```
interface Env {
  TREASURE_CAVE: KVNamespace;
}
```

### 基本操作示例

**typescript**

复制

下载

```
// 写入数据
await env.TREASURE_CAVE.put("user:123", JSON.stringify({ name: "Alice", age: 30 }));

// 读取数据
const data = await env.TREASURE_CAVE.get("user:123");
const user = data ? JSON.parse(data) : null;

// 删除数据
await env.TREASURE_CAVE.delete("user:123");

// 列出所有键
const keys = await env.TREASURE_CAVE.list();
```

### 高级选项

**typescript**

复制

下载

```
// 带过期时间的写入 (60秒后过期)
await env.TREASURE_CAVE.put("temp:session", "value", { expirationTtl: 60 });

// 带特定时间点过期的写入 (在特定时间戳过期)
await env.TREASURE_CAVE.put("temp:session", "value", { expiration: 1735689600 });

// 带元数据的写入
await env.TREASURE_CAVE.put("user:123", "value", { 
  metadata: { createdBy: "admin", tags: ["vip"] }
});

// 获取带元数据
const { value, metadata } = await env.TREASURE_CAVE.getWithMetadata("user:123");
```

## 最佳实践

1. **键命名规范** ：

* 使用命名空间前缀，如 `user:123`, `config:app`
* 避免特殊字符，使用小写字母、数字和冒号/下划线

1. **值大小限制** ：

* 单个值最大25MB
* 单个命名空间总大小不超过1GB（免费计划）或更大（付费计划）

1. **性能考虑** ：

* KV是最终一致的，写入后可能不会立即在所有地理位置读取到
* 对性能敏感的场景考虑使用缓存

1. **环境隔离** ：

* 开发、预览和生产环境使用不同的命名空间
* 使用 `wrangler.toml`环境配置管理不同环境的绑定

1. **数据备份** ：

* 定期使用 `wrangler kv:bulk get`导出重要数据
* 考虑实现自定义备份策略

## 注意事项

1. KV存储是最终一致的，写入后可能需要几秒钟才能在全球范围内可用
2. 免费计划有操作速率限制（每天1000次写入，10000次读取）
3. 生产环境操作前，先在预览环境测试
4. 敏感数据应考虑加密后再存储
5. 大型数据集应考虑分片存储

## 调试技巧

**bash**

复制

下载

```
# 查看操作日志
npx wrangler kv:key get --binding TREASURE_CAVE "key-name" --verbose

# 本地开发时查看KV存储文件位置
ls -la .wrangler/state/v3/kv/
```

## 与D1数据库的对比

| 特性         | KV 存储                       | D1 数据库                 |
| ------------ | ----------------------------- | ------------------------- |
| 数据模型     | 简单的键值对                  | 关系型数据库，支持SQL     |
| 查询能力     | 只能按键查找                  | 支持复杂查询和连接        |
| 一致性模型   | 最终一致                      | 强一致                    |
| 最大数据大小 | 每个值25MB，命名空间1GB(免费) | 5GB(免费)                 |
| 最佳使用场景 | 配置、会话、缓存、简单数据    | 需要复杂查询和关系的数据  |
| 本地开发支持 | 支持，存储在.wrangler目录     | 支持，存储在.wrangler目录 |

import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// 创建一个基于 /api 路径的应用
const app = new Hono().basePath('/api')

// 全局中间件
app.use('*', logger())  // 日志
app.use('*', prettyJSON())  // 美化 JSON
app.use('*', cors())  // CORS

// 禁用缓存的中间件
app.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
})

// Hello API
app.get('/hello', (c) => {
  const name = c.req.query('name') || 'World'
  return c.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString()
  })
})

// Test API
app.get('/test', (c) => {
  return c.json({
    message: 'Test route working!',
    timestamp: new Date().toISOString()
  })
})

// API 信息
app.get('/', (c) => {
  return c.json({
    message: 'API is working!',
    endpoints: [
      '/api',
      '/api/hello',
      '/api/test'
    ],
    timestamp: new Date().toISOString()
  })
})

// 错误处理
app.onError((err, c) => {
  console.error(`[Error] ${err.message}`)
  return c.json({
    error: err.message || 'Internal Server Error',
    status: 500
  }, 500)
})

// 404 处理
app.notFound((c) => {
  return c.json({
    error: 'API Not Found',
    path: new URL(c.req.url).pathname,
    timestamp: new Date().toISOString()
  }, 404)
})

export const onRequest = handle(app) 
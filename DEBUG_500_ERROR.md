# HTTP 500 错误诊断指南

## 🔍 问题描述

前端返回 HTTP 500 错误，提示"请求失败"。

## 📋 诊断步骤

### 1. 检查后端服务是否运行

确保后端服务正在运行在 `http://localhost:5000`：

```bash
cd backend
npm start
```

应该看到：
```
✔ Server is running on http://localhost:5000
```

### 2. 查看后端日志

当发生 HTTP 500 错误时，后端终端应该会显示详细的错误信息。请查看：

1. **错误消息**：`error: ...`
2. **错误堆栈**：`stack: ...`（开发环境会显示）
3. **错误代码**：`code: ...`

### 3. 检查环境变量

确保后端 `.env` 文件配置正确：

```bash
cd backend
cat .env
```

应该包含：
- `OPENAI_API_KEY=sk-...` 或 `OPENAI_API_KEY=sk-proj-...`
- `OPENAI_MODEL=gpt-4o-2024-11-20`（或其他支持的模型）

### 4. 检查前端环境变量

确保前端 `.env.local` 文件配置正确：

```bash
cd frontend
cat .env.local
```

应该包含：
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 5. 测试后端 API 直接调用

使用 curl 或 Postman 直接测试后端 API：

```bash
curl -X POST http://localhost:5000/api/v1/events/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "明天下午3点和老板开会",
    "context": {
      "current_time": "2026-01-02T18:00:00+08:00",
      "timezone": "Asia/Shanghai"
    }
  }'
```

查看返回的错误信息。

### 6. 检查浏览器控制台

打开浏览器开发者工具（F12），查看：
- **Console** 标签：是否有 JavaScript 错误
- **Network** 标签：查看请求详情
  - 请求 URL
  - 请求头
  - 请求体
  - 响应状态码
  - 响应体（错误详情）

### 7. 常见错误原因

#### 7.1 OpenAI API Key 问题
- **症状**：后端日志显示 `401 Authentication Fails`
- **解决**：检查 `.env` 中的 `OPENAI_API_KEY` 是否正确

#### 7.2 模型不支持 Structured Outputs
- **症状**：后端日志显示 `400 Invalid schema` 或 `response_format type is unavailable`
- **解决**：确保使用支持 Structured Outputs 的模型（如 `gpt-4o-2024-11-20`）

#### 7.3 网络连接问题
- **症状**：后端日志显示 `ECONNRESET`、`ETIMEDOUT` 等
- **解决**：检查网络连接，或使用代理

#### 7.4 解析失败
- **症状**：后端日志显示 `PARSING_FAILED` 或 `Invalid AI response structure`
- **解决**：可能是 AI 返回的数据格式不正确，重试或检查输入

#### 7.5 验证失败
- **症状**：后端日志显示 `Invalid event structure` 或 `时间格式错误`
- **解决**：检查 AI 返回的事件数据是否符合 schema

## 🛠️ 快速修复

### 如果看到 "OpenAI API 认证失败"
```bash
# 检查 API Key
cd backend
node -e "require('dotenv').config(); console.log('API Key length:', process.env.OPENAI_API_KEY?.length)"
```

### 如果看到 "模型不支持"
```bash
# 检查模型配置
cd backend
node -e "require('dotenv').config(); console.log('Model:', process.env.OPENAI_MODEL)"
```

### 如果看到 "解析失败"
查看后端日志中的详细错误信息，特别是：
- `content: ...` - AI 返回的原始内容
- `result: ...` - 解析后的数据结构
- `event: ...` - 具体哪个事件有问题

## 📝 报告错误

如果问题仍然存在，请提供以下信息：

1. **后端日志**：完整的错误日志（包括堆栈跟踪）
2. **浏览器 Network 标签**：请求和响应的详细信息
3. **环境信息**：
   - Node.js 版本：`node -v`
   - 操作系统
   - 使用的模型和 API Key 类型（个人或项目级）

## 🔗 相关文件

- 后端错误处理：`backend/src/middlewares/error-handler.js`
- 解析控制器：`backend/src/controllers/parse.controller.js`
- 前端 API 调用：`frontend/lib/api/schedule.ts`


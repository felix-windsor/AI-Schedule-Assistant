# AI 日程助手 - 后端 API

生产级别的后端服务，使用 OpenAI Structured Outputs 解析自然语言日程。

## 功能特性

- ✅ 使用 OpenAI Structured Outputs 保证 100% 格式正确
- ✅ 完整的错误处理系统（错误码 E1xxx/E5xxx）
- ✅ 生产级 System Prompt（详细的时间解析规则）
- ✅ FullCalendar 兼容的数据格式
- ✅ 支持多事件、全天事件、重复事件
- ✅ 完整的参数验证和时区处理

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写：

```env
OPENAI_API_KEY=sk-your-api-key-here
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
```

### 3. 启动服务

```bash
npm start
# 或开发模式（自动重启）
npm run dev
```

服务将在 `http://localhost:5000` 启动。

## API 文档

### 健康检查

```bash
GET /health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T20:00:00+08:00",
  "service": "AI Schedule Assistant API",
  "version": "1.0.0"
}
```

### 解析日程

```bash
POST /api/v1/events/parse
```

请求体：
```json
{
  "text": "明天下午3点和老板开会1小时",
  "context": {
    "current_time": "2025-01-01T20:00:00+08:00",
    "timezone": "Asia/Shanghai",
    "locale": "zh-CN"
  },
  "options": {
    "default_duration": 60,
    "allow_past_events": false,
    "max_events": 10
  }
}
```

成功响应：
```json
{
  "success": true,
  "timestamp": "2025-01-01T20:00:05+08:00",
  "request_id": "req_1704117600000_abc123",
  "events": [
    {
      "id": "evt_1704117600000_0",
      "title": "和老板开会",
      "start": "2025-01-02T15:00:00+08:00",
      "end": "2025-01-02T16:00:00+08:00",
      "allDay": false,
      "backgroundColor": "#3788d8",
      "extendedProps": {
        "category": "work",
        "timezone": "Asia/Shanghai"
      },
      "metadata": {
        "confidence": 0.95,
        "sourceText": "明天下午3点和老板开会1小时",
        "inferredFields": ["end", "category"]
      }
    }
  ],
  "metadata": {
    "total_events": 1,
    "parsing_time_ms": 1250,
    "confidence_score": 0.95
  }
}
```

错误响应：
```json
{
  "success": false,
  "timestamp": "2025-01-01T20:00:05+08:00",
  "error": {
    "code": "E1001",
    "message": "输入内容不能为空或格式错误",
    "details": "text 字段不能为空",
    "suggestion": "请提供日程描述，例如：明天下午3点开会"
  }
}
```

## 错误码

### 客户端错误 (4xx)

- `E1001`: 输入为空或格式错误
- `E1002`: 缺少必需的 context 参数
- `E1003`: 时区格式错误
- `E1004`: 时间描述模糊，无法解析
- `E1005`: 不允许创建过去的事件
- `E1006`: 超过 max_events 限制

### 服务器错误 (5xx)

- `E5001`: AI 服务调用失败
- `E5002`: 解析失败（AI 返回无效数据）
- `E5003`: 请求超时
- `E5004`: 超过速率限制
- `E5005`: 内部错误

## 测试

运行 API 集成测试：

```bash
npm test
```

**注意**: 测试前需要先启动服务器。

## 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── openai.js              # OpenAI 配置
│   ├── schemas/
│   │   └── event-schema.js        # Structured Outputs Schema
│   ├── prompts/
│   │   └── system-prompt.js       # System Prompt
│   ├── controllers/
│   │   └── parse.controller.js    # 解析控制器
│   ├── middlewares/
│   │   ├── validation.js          # 参数验证
│   │   ├── error-handler.js       # 错误处理
│   │   └── logger.js              # 日志
│   ├── utils/
│   │   ├── error-codes.js         # 错误码定义
│   │   └── timezone-validator.js  # 时区验证
│   └── app.js                     # Express 应用
├── tests/
│   └── api.test.js                # API 测试
└── package.json
```

## 技术栈

- Node.js 18+
- Express 4.x
- OpenAI SDK 4.x (Structured Outputs)
- dotenv (环境变量)

## 许可证

MIT

/**
 * Express 应用入口
 */

const path = require('path');
// 确保从 backend 目录加载 .env 文件
// 使用 override: true 让 .env 文件中的值覆盖系统环境变量
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath, override: true });
const express = require('express');
const cors = require('cors'); // 跨域请求中间件
const { requestLogger } = require('./middlewares/logger'); // 请求日志中间件
const { validateParseRequest } = require('./middlewares/validation'); // 请求参数验证中间件
const { errorHandler, notFoundHandler } = require('./middlewares/error-handler'); // 错误处理中间件
const { parseSchedule } = require('./controllers/parse.controller'); // 解析控制器

const app = express(); // 创建 express 应用

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// 根路径 - API 信息
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'AI Schedule Assistant API',
    version: '1.0.0',
    description: '智能日程解析服务，将自然语言转换为结构化日历事件',
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: '健康检查',
      },
      parse: {
        method: 'POST',
        path: '/api/v1/events/parse',
        description: '解析自然语言日程描述',
        example: {
          text: '明天下午3点和老板开会',
          context: {
            current_time: '2026-01-02T10:00:00+08:00',
            timezone: 'Asia/Shanghai',
          },
        },
      },
    },
    documentation: '查看 README.md 或 TESTING.md 了解详细使用方法',
    timestamp: new Date().toISOString(),
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Schedule Assistant API',
    version: '1.0.0',
  });
});

// API 路由
app.post('/api/v1/events/parse', validateParseRequest, parseSchedule);

// 404 处理
app.use(notFoundHandler);

// 错误处理（必须在最后）
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

module.exports = app;


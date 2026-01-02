/**
 * Express 应用入口
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { requestLogger } = require('./middlewares/logger');
const { validateParseRequest } = require('./middlewares/validation');
const { errorHandler, notFoundHandler } = require('./middlewares/error-handler');
const { parseSchedule } = require('./controllers/parse.controller');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

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


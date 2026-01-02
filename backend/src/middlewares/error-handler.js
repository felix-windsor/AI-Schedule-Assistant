/**
 * 统一错误处理中间件
 */

const { logger } = require('./logger');
const { createErrorResponse, ErrorCodes } = require('../utils/error-codes');

/**
 * 错误处理中间件
 * 捕获所有错误并返回统一格式的响应
 */
function errorHandler(err, req, res, next) {
  // 如果响应已经发送，交给 Express 默认错误处理
  if (res.headersSent) {
    return next(err);
  }

  // 记录错误
  logger.error('Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // 如果是我们自定义的错误响应
  if (err.httpStatus && err.error) {
    return res.status(err.httpStatus).json(err);
  }

  // OpenAI API 错误
  if (err.status) {
    if (err.status === 429) {
      const error = createErrorResponse('RATE_LIMIT_EXCEEDED', 'OpenAI API 速率限制', '请稍后再试');
      return res.status(error.httpStatus).json(error);
    }

    if (err.status === 503 || err.status >= 500) {
      const error = createErrorResponse('AI_SERVICE_ERROR', `OpenAI API 错误: ${err.message}`, '请稍后重试');
      return res.status(error.httpStatus).json(error);
    }

    if (err.status === 401) {
      const error = createErrorResponse('AI_SERVICE_ERROR', 'OpenAI API 认证失败', '请检查 API Key 配置');
      return res.status(error.httpStatus).json(error);
    }
  }

  // JSON 解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const error = createErrorResponse('INVALID_INPUT', '请求体格式错误', '请检查 JSON 格式');
    return res.status(error.httpStatus).json(error);
  }

  // 超时错误
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    const error = createErrorResponse('TIMEOUT', '请求超时', '请稍后重试');
    return res.status(error.httpStatus).json(error);
  }

  // 默认内部错误
  const error = createErrorResponse('INTERNAL_ERROR', 
    process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
    '请稍后重试或联系技术支持'
  );
  
  return res.status(error.httpStatus).json(error);
}

/**
 * 404 处理
 */
function notFoundHandler(req, res) {
  const error = createErrorResponse('NOT_FOUND', `路径不存在: ${req.method} ${req.path}`, '请检查 API 路径，可用的路径: GET /health, POST /api/v1/events/parse');
  res.status(error.httpStatus).json(error);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};


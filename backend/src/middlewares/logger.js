/**
 * 请求日志中间件
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = process.env.LOG_LEVEL || 'info';
const logLevelValue = LOG_LEVELS[currentLogLevel.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * 格式化日志消息
 */
function formatLogMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
  };

  if (data) {
    logEntry.data = data;
  }

  return JSON.stringify(logEntry);
}

/**
 * 日志记录函数
 */
const logger = {
  error: (message, data = null) => {
    if (logLevelValue >= LOG_LEVELS.ERROR) {
      console.error(formatLogMessage('ERROR', message, data));
    }
  },

  warn: (message, data = null) => {
    if (logLevelValue >= LOG_LEVELS.WARN) {
      console.warn(formatLogMessage('WARN', message, data));
    }
  },

  info: (message, data = null) => {
    if (logLevelValue >= LOG_LEVELS.INFO) {
      console.log(formatLogMessage('INFO', message, data));
    }
  },

  debug: (message, data = null) => {
    if (logLevelValue >= LOG_LEVELS.DEBUG) {
      console.log(formatLogMessage('DEBUG', message, data));
    }
  },
};

/**
 * Express 请求日志中间件
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // 记录请求
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // 记录响应
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

module.exports = {
  logger,
  requestLogger,
};


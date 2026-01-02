/**
 * 错误码定义
 * E1xxx: 客户端错误 (4xx)
 * E5xxx: 服务器错误 (5xx)
 */

const ErrorCodes = {
  // 客户端错误 (4xx)
  INVALID_INPUT: {
    code: 'E1001',
    message: '输入内容不能为空或格式错误',
    httpStatus: 400,
  },
  MISSING_CONTEXT: {
    code: 'E1002',
    message: '缺少必需的 context 参数',
    httpStatus: 400,
  },
  INVALID_TIMEZONE: {
    code: 'E1003',
    message: '时区格式错误',
    httpStatus: 400,
  },
  AMBIGUOUS_TIME: {
    code: 'E1004',
    message: '时间描述过于模糊，无法解析',
    httpStatus: 400,
  },
  PAST_EVENT_NOT_ALLOWED: {
    code: 'E1005',
    message: '不允许创建过去的事件',
    httpStatus: 400,
  },
  TOO_MANY_EVENTS: {
    code: 'E1006',
    message: '超过 max_events 限制',
    httpStatus: 400,
  },

  // 服务器错误 (5xx)
  AI_SERVICE_ERROR: {
    code: 'E5001',
    message: 'AI 解析服务暂时不可用',
    httpStatus: 503,
  },
  PARSING_FAILED: {
    code: 'E5002',
    message: '解析失败，AI 返回无效数据',
    httpStatus: 500,
  },
  TIMEOUT: {
    code: 'E5003',
    message: '请求超时',
    httpStatus: 504,
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'E5004',
    message: '请求过于频繁，请稍后再试',
    httpStatus: 429,
  },
  INTERNAL_ERROR: {
    code: 'E5005',
    message: '服务器内部错误',
    httpStatus: 500,
  },
};

/**
 * 创建错误响应对象
 * @param {string} errorCode - 错误码键名
 * @param {string} details - 详细错误信息（可选）
 * @param {string} suggestion - 解决建议（可选）
 * @returns {Object} 错误响应对象
 */
function createErrorResponse(errorCode, details = null, suggestion = null) {
  const error = ErrorCodes[errorCode];
  if (!error) {
    throw new Error(`Unknown error code: ${errorCode}`);
  }

  const response = {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      code: error.code,
      message: error.message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  if (suggestion) {
    response.error.suggestion = suggestion;
  }

  return {
    ...response,
    httpStatus: error.httpStatus,
  };
}

module.exports = {
  ErrorCodes,
  createErrorResponse,
};


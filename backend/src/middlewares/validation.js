/**
 * 请求参数验证中间件
 */

const { createErrorResponse } = require('../utils/error-codes');
const { isValidTimezone, isValidISO8601WithTimezone } = require('../utils/timezone-validator');

/**
 * 验证解析请求参数
 */
function validateParseRequest(req, res, next) {
  const { text, context, options } = req.body;

  // 验证 text
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    const error = createErrorResponse('INVALID_INPUT', 'text 字段不能为空', '请提供日程描述，例如：明天下午3点开会');
    return res.status(error.httpStatus).json(error);
  }

  if (text.length > 2000) {
    const error = createErrorResponse('INVALID_INPUT', 'text 长度不能超过 2000 字符', '请缩短输入内容');
    return res.status(error.httpStatus).json(error);
  }

  // 验证 context
  if (!context || typeof context !== 'object') {
    const error = createErrorResponse('MISSING_CONTEXT', '缺少 context 参数', '请提供 current_time 和 timezone');
    return res.status(error.httpStatus).json(error);
  }

  // 验证 current_time
  if (!context.current_time || typeof context.current_time !== 'string') {
    const error = createErrorResponse('MISSING_CONTEXT', '缺少 context.current_time', '请提供 ISO 8601 格式的当前时间');
    return res.status(error.httpStatus).json(error);
  }

  if (!isValidISO8601WithTimezone(context.current_time)) {
    const error = createErrorResponse('MISSING_CONTEXT', 'context.current_time 格式错误', '请使用 ISO 8601 格式，必须包含时区，例如：2025-01-01T20:00:00+08:00');
    return res.status(error.httpStatus).json(error);
  }

  // 验证 timezone
  if (!context.timezone || typeof context.timezone !== 'string') {
    const error = createErrorResponse('MISSING_CONTEXT', '缺少 context.timezone', '请提供 IANA 时区标识符，例如：Asia/Shanghai');
    return res.status(error.httpStatus).json(error);
  }

  if (!isValidTimezone(context.timezone)) {
    const error = createErrorResponse('INVALID_TIMEZONE', `无效的时区: ${context.timezone}`, '请使用有效的 IANA 时区标识符，例如：Asia/Shanghai, America/New_York');
    return res.status(error.httpStatus).json(error);
  }

  // 验证 options (如果提供)
  if (options && typeof options === 'object') {
    if (options.default_duration !== undefined) {
      if (typeof options.default_duration !== 'number' || options.default_duration < 1 || options.default_duration > 1440) {
        const error = createErrorResponse('INVALID_INPUT', 'default_duration 必须在 1-1440 分钟之间', '请提供有效的时长（分钟）');
        return res.status(error.httpStatus).json(error);
      }
    }

    if (options.max_events !== undefined) {
      if (typeof options.max_events !== 'number' || options.max_events < 1 || options.max_events > 50) {
        const error = createErrorResponse('INVALID_INPUT', 'max_events 必须在 1-50 之间', '请提供有效的事件数量限制');
        return res.status(error.httpStatus).json(error);
      }
    }
  }

  // 验证通过，继续
  next();
}

module.exports = {
  validateParseRequest,
};


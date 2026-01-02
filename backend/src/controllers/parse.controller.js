/**
 * 解析控制器
 * 处理日程解析请求
 */

const { openai, getModel } = require('../config/openai');
const eventSchema = require('../schemas/event-schema');
const buildSystemPrompt = require('../prompts/system-prompt');
const { createErrorResponse } = require('../utils/error-codes');
const { logger } = require('../middlewares/logger');

/**
 * 解析日程
 * POST /api/v1/events/parse
 */
async function parseSchedule(req, res, next) {
  const startTime = Date.now();
  const { text, context, options = {} } = req.body;

  try {
    logger.info('Parsing schedule request', {
      textLength: text.length,
      timezone: context.timezone,
      hasOptions: Object.keys(options).length > 0,
    });

    // 构建 System Prompt
    const systemPrompt = buildSystemPrompt(context, options);

    // 调用 OpenAI API
    const model = getModel();
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'calendar_events',
          schema: eventSchema,
          strict: true,
        },
      },
      temperature: 0.3, // 降低温度以提高准确性
      max_tokens: 4000,
    });

    // 解析响应
    const content = response.choices[0].message.content;
    let result;

    try {
      result = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse AI response', {
        content: content.substring(0, 200),
        error: parseError.message,
      });
      throw createErrorResponse('PARSING_FAILED', 'AI 返回的数据格式错误', '请重试');
    }

    // 验证结果
    if (!result.events || !Array.isArray(result.events)) {
      logger.error('Invalid AI response structure', { result });
      throw createErrorResponse('PARSING_FAILED', 'AI 返回的数据结构错误', '请重试');
    }

    // 检查事件数量限制
    const maxEvents = options.max_events || 10;
    if (result.events.length > maxEvents) {
      logger.warn('Too many events parsed', {
        count: result.events.length,
        max: maxEvents,
      });
      result.events = result.events.slice(0, maxEvents);
    }

    // 验证每个事件的基本字段
    for (let i = 0; i < result.events.length; i++) {
      const event = result.events[i];
      
      if (!event.id || !event.title || !event.start || !event.end || event.allDay === undefined) {
        logger.error('Invalid event structure', { event, index: i });
        throw createErrorResponse('PARSING_FAILED', `事件 ${i + 1} 缺少必需字段`, '请重试');
      }

      // 验证时间格式
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        logger.error('Invalid date format', { event, index: i });
        throw createErrorResponse('PARSING_FAILED', `事件 ${i + 1} 时间格式错误`, '请重试');
      }

      // 验证时间逻辑
      if (endDate <= startDate) {
        logger.error('Invalid time range', { event, index: i });
        throw createErrorResponse('PARSING_FAILED', `事件 ${i + 1} 结束时间必须晚于开始时间`, '请重试');
      }

      // 验证时区格式
      if (!event.start.includes('+') && !event.start.includes('-')) {
        logger.error('Missing timezone in start time', { event, index: i });
        throw createErrorResponse('PARSING_FAILED', `事件 ${i + 1} 开始时间缺少时区信息`, '请重试');
      }

      // 验证过去事件（如果不允许）
      if (!options.allow_past_events) {
        const currentTime = new Date(context.current_time);
        if (startDate < currentTime) {
          logger.warn('Past event detected', { event, index: i, currentTime, startDate });
          // 不抛出错误，只是记录警告
        }
      }
    }

    // 计算处理时间
    const processingTime = Date.now() - startTime;

    // 返回成功响应
    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      events: result.events,
      metadata: {
        total_events: result.events.length,
        parsing_time_ms: processingTime,
        confidence_score: result.events.length > 0
          ? result.events.reduce((sum, e) => sum + (e.metadata?.confidence || 0), 0) / result.events.length
          : 0,
        model: model,
      },
    };

    logger.info('Schedule parsed successfully', {
      eventCount: result.events.length,
      processingTime: `${processingTime}ms`,
    });

    res.json(responseData);

  } catch (error) {
    // 如果是我们自定义的错误响应，直接传递
    if (error.httpStatus && error.error) {
      return res.status(error.httpStatus).json(error);
    }

    // 其他错误，记录并返回通用错误
    logger.error('Parse schedule error', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // OpenAI API 错误
    if (error.status) {
      if (error.status === 429) {
        const errorResponse = createErrorResponse('RATE_LIMIT_EXCEEDED', 'OpenAI API 速率限制', '请稍后再试');
        return res.status(errorResponse.httpStatus).json(errorResponse);
      }

      if (error.status === 503 || error.status >= 500) {
        const errorResponse = createErrorResponse('AI_SERVICE_ERROR', `OpenAI API 错误: ${error.message}`, '请稍后重试');
        return res.status(errorResponse.httpStatus).json(errorResponse);
      }
    }

    // 默认错误
    const errorResponse = createErrorResponse('INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : '解析失败，请重试',
      '请稍后重试或联系技术支持'
    );

    res.status(errorResponse.httpStatus).json(errorResponse);
  }
}

module.exports = {
  parseSchedule,
};


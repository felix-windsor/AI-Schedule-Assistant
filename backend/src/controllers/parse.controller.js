/**
 * 解析控制器
 * 处理日程解析请求
 */

const { getOpenAIClient, getModel, getAPIKey } = require('../config/openai');
const eventSchema = require('../schemas/event-schema');
const buildSystemPrompt = require('../prompts/system-prompt');
const { createErrorResponse } = require('../utils/error-codes');
const { logger } = require('../middlewares/logger');
const axios = require('axios');

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
    const apiKey = getAPIKey();
    
    // 尝试使用 Structured Outputs，如果失败则降级到普通 JSON 模式
    let response;
    let useStructuredOutputs = true;
    
    // 首先尝试使用 OpenAI SDK
    const openai = getOpenAIClient();
    
    try {
      response = await openai.chat.completions.create({
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
        temperature: 0.3,
        max_tokens: 4000,
      });
    } catch (sdkError) {
      // 如果 SDK 失败，尝试使用 axios 直接调用
      // 检查是否是认证错误、连接错误或其他可恢复的错误
      const errorName = sdkError.constructor?.name || '';
      const errorMessage = sdkError.message || '';
      const errorCode = sdkError.code || '';
      
      const isRecoverableError = 
        sdkError.status === 401 || // 认证错误
        errorName === 'APIConnectionError' || // 连接错误
        errorCode === 'APIConnectionError' ||
        errorMessage.includes('Connection error') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ETIMEDOUT');
      
      if (isRecoverableError) {
        const errorType = sdkError.status === 401 ? '401 认证错误' : 
                         errorName === 'APIConnectionError' ? '连接错误' : 'SDK 错误';
        logger.warn(`OpenAI SDK 返回 ${errorType}，尝试使用 axios 直接调用 API`, {
          error: errorMessage,
          errorType: errorName,
          errorCode: errorCode,
          status: sdkError.status,
        });
        
        try {
          // 使用 axios 直接调用 OpenAI API
          const axiosResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
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
              temperature: 0.3,
              max_tokens: 4000,
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          // 将 axios 响应转换为 SDK 格式
          response = { choices: axiosResponse.data.choices };
          logger.info('使用 axios 成功调用 OpenAI API');
        } catch (axiosError) {
          // axios 也失败，检查是否是 Structured Outputs 不支持
          if (axiosError.response && axiosError.response.status === 400 && 
              axiosError.response.data && axiosError.response.data.error && 
              axiosError.response.data.error.message && 
              axiosError.response.data.error.message.includes('response_format')) {
            
            logger.warn('Structured Outputs not available, falling back to JSON mode', {
              model: model,
            });
            
            useStructuredOutputs = false;
            
            // 使用普通 JSON 模式
            const jsonSystemPrompt = systemPrompt + '\n\n重要：你必须严格按照以下 JSON Schema 格式返回数据，不要添加任何额外的文本或说明：\n' + JSON.stringify(eventSchema, null, 2);
            
            const jsonResponse = await axios.post(
              'https://api.openai.com/v1/chat/completions',
              {
                model: model,
                messages: [
                  {
                    role: 'system',
                    content: jsonSystemPrompt,
                  },
                  {
                    role: 'user',
                    content: text,
                  },
                ],
                response_format: {
                  type: 'json_object',
                },
                temperature: 0.3,
                max_tokens: 4000,
              },
              {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            response = { choices: jsonResponse.data.choices };
          } else {
            // 其他错误，抛出原始错误
            throw axiosError;
          }
        }
      } else if (sdkError.message && sdkError.message.includes('response_format')) {
        // Structured Outputs 不支持，降级到 JSON 模式
        logger.warn('Structured Outputs not available, falling back to JSON mode', {
          model: model,
          error: sdkError.message,
        });
        
        useStructuredOutputs = false;
        
        const jsonSystemPrompt = systemPrompt + '\n\n重要：你必须严格按照以下 JSON Schema 格式返回数据，不要添加任何额外的文本或说明：\n' + JSON.stringify(eventSchema, null, 2);
        
        response = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: jsonSystemPrompt,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          response_format: {
            type: 'json_object',
          },
          temperature: 0.3,
          max_tokens: 4000,
        });
      } else {
        // 其他错误，直接抛出
        throw sdkError;
      }
    }

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
        use_structured_outputs: useStructuredOutputs,
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
      status: error.status,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // OpenAI API 错误
    if (error.status) {
      if (error.status === 429) {
        const errorResponse = createErrorResponse('RATE_LIMIT_EXCEEDED', 'OpenAI API 速率限制', '请稍后再试');
        return res.status(errorResponse.httpStatus).json(errorResponse);
      }

      if (error.status === 400) {
        // 400 错误可能是参数错误，包括 response_format 不可用
        const errorMessage = error.message || 'OpenAI API 请求参数错误';
        const errorResponse = createErrorResponse('AI_SERVICE_ERROR', 
          `OpenAI API 错误: ${errorMessage}`, 
          '请检查模型配置或稍后重试'
        );
        return res.status(errorResponse.httpStatus).json(errorResponse);
      }

      if (error.status === 401) {
        const errorResponse = createErrorResponse('AI_SERVICE_ERROR', 'OpenAI API 认证失败', '请检查 API Key 配置');
        return res.status(errorResponse.httpStatus).json(errorResponse);
      }

      if (error.status === 503 || error.status >= 500) {
        const errorResponse = createErrorResponse('AI_SERVICE_ERROR', `OpenAI API 服务错误: ${error.message}`, '请稍后重试');
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


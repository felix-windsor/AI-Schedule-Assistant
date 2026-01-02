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
 * 获取代理配置
 * 从环境变量中读取代理设置，返回 axios proxy 配置对象
 * 测试发现：axios 的 proxy 选项（对象格式）比 HttpsProxyAgent 更稳定
 */
function getProxyConfig() {
  // 重新加载环境变量（确保获取最新的 .env 配置）
  const path = require('path');
  const envPath = path.resolve(__dirname, '../.env');
  require('dotenv').config({ path: envPath, override: true });
  
  // 如果环境变量 ENABLE_PROXY 设置为 false，则跳过代理
  if (process.env.ENABLE_PROXY === 'false') {
    if (process.env.NODE_ENV === 'development') {
      logger.info('代理已禁用（ENABLE_PROXY=false）');
    }
    return null;
  }
  
  // 优先使用 HTTPS_PROXY，如果没有则使用 HTTP_PROXY
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
  
  if (proxyUrl) {
    try {
      // 解析代理 URL 为对象格式（这是最稳定的方式）
      const url = new URL(proxyUrl);
      const proxyConfig = {
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
        protocol: url.protocol.replace(':', ''),
      };
      
      // 如果代理 URL 包含认证信息
      if (url.username || url.password) {
        proxyConfig.auth = {
          username: url.username || '',
          password: url.password || '',
        };
      }
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('使用代理服务器', { proxyUrl: proxyUrl.replace(/:[^:@]+@/, ':****@') }); // 隐藏密码
      }
      return proxyConfig;
    } catch (error) {
      logger.warn('代理配置错误，将跳过代理', { error: error.message, proxyUrl });
      return null;
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      logger.info('未配置代理服务器，将直接连接');
    }
  }
  
  return null;
}

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
    
    // 优先使用 axios 直接调用（更稳定、更快）
    // 跳过 SDK，因为自定义 fetch 实现可能导致超时问题
    
    // 获取代理配置（可选）
    const proxyConfig = getProxyConfig();
    
    // 重试机制：最多重试 3 次
    let lastError = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        if (retryCount > 0) {
          logger.info(`重试 OpenAI API 调用 (第 ${retryCount} 次)`);
          // 等待一段时间再重试（指数退避，增加等待时间）
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        } else {
          logger.info('使用 axios 直接调用 OpenAI API (Structured Outputs)');
        }
        
        const axiosConfig = {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: proxyConfig ? 90000 : 30000, // 使用代理时增加超时时间到 90 秒
          maxRedirects: 5,
        };
        
        // 如果配置了代理，使用 axios 的 proxy 选项（对象格式，最稳定）
        if (proxyConfig) {
          axiosConfig.proxy = proxyConfig;
        }
        
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
          axiosConfig
        );
        
        // 将 axios 响应转换为 SDK 格式
        response = { choices: axiosResponse.data.choices };
        logger.info('使用 axios 成功调用 OpenAI API (Structured Outputs)');
        break; // 成功，退出重试循环
      } catch (axiosError) {
        lastError = axiosError;
        retryCount++;
        
        // 检查是否是可重试的错误
        const isRetryableError = 
          axiosError.code === 'ECONNRESET' ||
          axiosError.code === 'ETIMEDOUT' ||
          axiosError.code === 'ECONNREFUSED' ||
          axiosError.message?.includes('socket hang up') ||
          axiosError.message?.includes('timeout');
        
        if (!isRetryableError || retryCount >= maxRetries) {
          // 不可重试的错误或已达到最大重试次数，抛出错误
          throw axiosError;
        }
        
        // 可重试的错误，继续循环
        logger.warn(`请求失败，将重试 (${retryCount}/${maxRetries})`, {
          error: axiosError.message,
          code: axiosError.code,
        });
      }
    }
    
    // 如果所有重试都失败
    if (!response) {
      throw lastError || new Error('所有重试都失败了');
    }
    
    // 如果成功，继续处理响应
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

    // 网络连接错误
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
      const errorResponse = createErrorResponse('AI_SERVICE_ERROR',
        `网络连接错误: ${error.message || '无法连接到 OpenAI API'}`,
        '请检查网络连接、防火墙设置，或配置代理服务器。如果在中国大陆，可能需要使用代理访问 OpenAI API。'
      );
      return res.status(errorResponse.httpStatus).json(errorResponse);
    }

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


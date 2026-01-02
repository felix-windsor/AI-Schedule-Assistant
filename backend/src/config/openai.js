const OpenAI = require('openai');
const path = require('path');
const axios = require('axios');

// 确保从 backend 目录加载 .env 文件
// 使用 override: true 让 .env 文件中的值覆盖系统环境变量
// __dirname 是 backend/src/config，所以需要回到 backend 目录
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath, override: true });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// 获取 API Key（每次调用时重新读取，确保获取最新值）
function getAPIKey() {
  // 重新加载环境变量
  const envPath = path.resolve(__dirname, '../.env');
  require('dotenv').config({ path: envPath, override: true });
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  
  const trimmedKey = apiKey.trim();
  
  // 调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] API Key 长度: ${trimmedKey.length}`);
    console.log(`[DEBUG] API Key 前缀: ${trimmedKey.substring(0, 20)}...`);
    console.log(`[DEBUG] API Key 后缀: ...${trimmedKey.substring(trimmedKey.length - 10)}`);
  }
  
  return trimmedKey;
}

// 创建一个基于 axios 的 fetch 实现，解决 SDK 连接问题
// 这个实现完全兼容 fetch API，让 SDK 可以正常使用
function createAxiosFetch() {
  return async (url, options = {}) => {
    try {
      // 处理 headers，确保格式正确
      const headers = {};
      if (options.headers) {
        // 如果 headers 是 Headers 对象，转换为普通对象
        if (options.headers instanceof Map) {
          for (const [key, value] of options.headers) {
            headers[key] = value;
          }
        } else if (options.headers.entries && typeof options.headers.entries === 'function') {
          // Headers 对象有 entries 方法
          for (const [key, value] of options.headers.entries()) {
            headers[key] = value;
          }
        } else if (typeof options.headers === 'object') {
          Object.assign(headers, options.headers);
        }
      }

      // 处理 body
      let requestData = options.body;
      if (requestData && typeof requestData === 'string') {
        // 保持为字符串，axios 会自动处理 JSON
        // 不要在这里解析，让 axios 处理 Content-Type
      }

      // 使用 axios 配置，与控制器中的配置保持一致
      // 注意：控制器中直接使用 axios.post，没有特殊配置
      // 所以这里也使用默认的 axios 配置
      const axiosConfig = {
        url: url,
        method: options.method || 'GET',
        headers: headers,
        timeout: options.timeout || 60000,
        validateStatus: () => true, // 不抛出错误，让 SDK 处理状态码
        // 添加重试配置，提高网络稳定性
        maxRedirects: 5,
        // 确保使用与控制器中相同的网络配置
      };

      // 处理 body/data
      if (requestData !== undefined && requestData !== null) {
        if (options.method === 'GET' || options.method === 'HEAD' || options.method === 'DELETE') {
          // GET/HEAD/DELETE 请求使用 params
          axiosConfig.params = typeof requestData === 'string' ? JSON.parse(requestData) : requestData;
        } else {
          // POST/PUT/PATCH 等请求使用 data
          axiosConfig.data = requestData;
        }
      }

      const response = await axios(axiosConfig);

      // 转换为 fetch 格式的 Response
      // 创建一个完整的 Headers 对象，兼容 fetch API
      const responseHeadersMap = new Map();
      if (response.headers) {
        Object.entries(response.headers).forEach(([key, value]) => {
          responseHeadersMap.set(key, value);
        });
      }

      const responseHeaders = {
        get: (name) => {
          const lowerName = name.toLowerCase();
          for (const [key, value] of responseHeadersMap) {
            if (key.toLowerCase() === lowerName) {
              return value;
            }
          }
          return null;
        },
        has: (name) => {
          const lowerName = name.toLowerCase();
          for (const [key] of responseHeadersMap) {
            if (key.toLowerCase() === lowerName) {
              return true;
            }
          }
          return false;
        },
        entries: () => responseHeadersMap.entries(),
        keys: () => responseHeadersMap.keys(),
        values: () => responseHeadersMap.values(),
        forEach: (callback) => {
          responseHeadersMap.forEach((value, key) => callback(value, key, responseHeaders));
        },
      };

      // 返回完整的 fetch Response 对象
      const fetchResponse = {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText || String(response.status),
        headers: responseHeaders,
        url: url,
        redirected: false,
        type: 'default',
        json: async () => {
          if (typeof response.data === 'string') {
            return JSON.parse(response.data);
          }
          return response.data;
        },
        text: async () => {
          if (typeof response.data === 'string') {
            return response.data;
          }
          return JSON.stringify(response.data);
        },
        arrayBuffer: async () => {
          if (Buffer.isBuffer(response.data)) {
            return response.data.buffer;
          }
          if (typeof response.data === 'string') {
            return Buffer.from(response.data, 'utf8').buffer;
          }
          return Buffer.from(JSON.stringify(response.data), 'utf8').buffer;
        },
        blob: async () => {
          // 简单的 blob 实现
          const data = typeof response.data === 'string' 
            ? response.data 
            : JSON.stringify(response.data);
          return new Blob([data], { type: response.headers['content-type'] || 'application/json' });
        },
        clone: () => {
          // 返回一个克隆的响应（简化实现）
          return fetchResponse;
        },
      };

      return fetchResponse;
    } catch (error) {
      // 转换为 fetch 格式的错误
      if (error.response) {
        // 有响应但状态码错误
        const responseHeaders = {
          get: (name) => {
            const lowerName = name.toLowerCase();
            for (const [key, value] of Object.entries(error.response.headers || {})) {
              if (key.toLowerCase() === lowerName) {
                return value;
              }
            }
            return null;
          },
        };
        return {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText || '',
          headers: responseHeaders,
          json: async () => error.response.data,
          text: async () => JSON.stringify(error.response.data),
        };
      }
      throw error;
    }
  };
}

// 创建 OpenAI 客户端（延迟初始化，使用函数获取 Key）
function getOpenAIClient() {
  const apiKey = getAPIKey();
  
  // 配置选项
  const clientOptions = {
    apiKey: apiKey,
    // 明确指定 baseURL，防止 SDK 自动检测到错误的 API 端点
    baseURL: 'https://api.openai.com/v1',
    // 增加超时时间（60秒）
    timeout: 60000,
    // 最大重试次数
    maxRetries: 2,
    // 使用基于 axios 的 fetch 实现，解决连接问题
    fetch: createAxiosFetch(),
  };
  
  return new OpenAI(clientOptions);
}

// 为了向后兼容，也导出一个默认的客户端实例
const openai = getOpenAIClient();

// 支持的模型列表（支持 Structured Outputs）
const SUPPORTED_MODELS = [
  'gpt-4o-2024-08-06',
  'gpt-4o-2024-11-20',
  'gpt-4o-mini-2024-07-18',
  'gpt-4o',
];

// 默认模型
const DEFAULT_MODEL = 'gpt-4o-2024-08-06';

// 获取配置的模型
function getModel() {
  // 重新加载环境变量（确保获取最新值）
  // 使用 override: true 让 .env 文件中的值覆盖系统环境变量
  // __dirname 是 backend/src/config，所以需要回到 backend 目录
  const envPath = path.resolve(__dirname, '../.env');
  require('dotenv').config({ path: envPath, override: true });
  
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  
  // 调试信息：显示实际使用的模型
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] 使用的模型: ${model}`);
    console.log(`[DEBUG] OPENAI_MODEL 环境变量: ${process.env.OPENAI_MODEL || '(未设置，使用默认值)'}`);
  }
  
  // 验证模型是否支持 Structured Outputs
  if (!SUPPORTED_MODELS.includes(model)) {
    console.warn(`警告: 模型 ${model} 可能不支持 Structured Outputs，建议使用: ${SUPPORTED_MODELS.join(', ')}`);
  } else {
    console.log(`✓ 模型 ${model} 支持 Structured Outputs`);
  }
  
  return model;
}

module.exports = {
  openai,
  getOpenAIClient, // 导出函数，可以在需要时获取新的客户端实例
  getAPIKey, // 导出函数，可以获取 API Key
  getModel,
  SUPPORTED_MODELS,
  DEFAULT_MODEL,
};


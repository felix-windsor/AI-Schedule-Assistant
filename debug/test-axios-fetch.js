/**
 * 测试基于 axios 的 fetch 实现
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const axios = require('axios');
const OpenAI = require('openai');

// 创建一个完整的 fetch 实现
function createAxiosFetch() {
  return async (url, options = {}) => {
    try {
      // 处理 headers
      const headers = {};
      if (options.headers) {
        if (options.headers instanceof Map) {
          for (const [key, value] of options.headers) {
            headers[key] = value;
          }
        } else if (options.headers.entries && typeof options.headers.entries === 'function') {
          for (const [key, value] of options.headers.entries()) {
            headers[key] = value;
          }
        } else if (typeof options.headers === 'object') {
          Object.assign(headers, options.headers);
        }
      }

      // 处理 body
      let data = options.body;
      if (data && typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          // 如果不是 JSON，保持原样
        }
      }

      // 构建 axios 配置
      const axiosConfig = {
        url: url,
        method: options.method || 'GET',
        headers: headers,
        timeout: options.timeout || 60000,
        validateStatus: () => true, // 让 SDK 处理状态码
      };

      // 处理 body/data
      if (data !== undefined && data !== null) {
        if (options.method === 'GET' || options.method === 'HEAD') {
          axiosConfig.params = data;
        } else {
          axiosConfig.data = data;
        }
      }

      console.log(`[FETCH] ${options.method || 'GET'} ${url}`);
      console.log(`[FETCH] Headers:`, Object.keys(headers).join(', '));

      const response = await axios(axiosConfig);

      // 创建 Headers 对象
      const responseHeaders = new Map();
      Object.entries(response.headers || {}).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      // 返回 fetch 格式的 Response
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText || '',
        headers: {
          get: (name) => {
            const lowerName = name.toLowerCase();
            for (const [key, value] of responseHeaders) {
              if (key.toLowerCase() === lowerName) {
                return value;
              }
            }
            return null;
          },
          has: (name) => {
            const lowerName = name.toLowerCase();
            for (const [key] of responseHeaders) {
              if (key.toLowerCase() === lowerName) {
                return true;
              }
            }
            return false;
          },
          entries: () => responseHeaders.entries(),
        },
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
            return Buffer.from(response.data).buffer;
          }
          return Buffer.from(JSON.stringify(response.data)).buffer;
        },
      };
    } catch (error) {
      console.error('[FETCH] Error:', error.message);
      // 如果有响应，返回错误响应
      if (error.response) {
        const responseHeaders = new Map();
        Object.entries(error.response.headers || {}).forEach(([key, value]) => {
          responseHeaders.set(key, value);
        });
        
        return {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText || '',
          headers: {
            get: (name) => {
              const lowerName = name.toLowerCase();
              for (const [key, value] of responseHeaders) {
                if (key.toLowerCase() === lowerName) {
                  return value;
                }
              }
              return null;
            },
            has: (name) => {
              const lowerName = name.toLowerCase();
              for (const [key] of responseHeaders) {
                if (key.toLowerCase() === lowerName) {
                  return true;
                }
              }
              return false;
            },
            entries: () => responseHeaders.entries(),
          },
          json: async () => error.response.data,
          text: async () => JSON.stringify(error.response.data),
        };
      }
      // 网络错误，抛出
      throw error;
    }
  };
}

async function test() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  console.log('=== 测试基于 axios 的 fetch 实现 ===\n');
  console.log(`API Key 长度: ${apiKey.length}`);
  console.log('');

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.openai.com/v1',
      fetch: createAxiosFetch(),
    });

    console.log('尝试调用 models.list()...');
    const response = await openai.models.list();
    
    console.log('\n✅ SDK 调用成功！');
    console.log(`模型数量: ${response.data.length}`);
    console.log('\n前 5 个模型:');
    response.data.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id}`);
    });
    
  } catch (error) {
    console.error('\n❌ SDK 调用失败:');
    console.error(`  错误类型: ${error.constructor.name}`);
    console.error(`  错误消息: ${error.message}`);
    if (error.cause) {
      console.error(`  原因: ${error.cause.message || error.cause}`);
    }
  }
}

test().catch(console.error);


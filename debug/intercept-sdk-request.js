/**
 * 拦截并比较 SDK 和 axios 发送的实际请求
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const OpenAI = require('openai');
const axios = require('axios');
const https = require('https');

// 创建一个可以拦截请求的 HTTP Agent
const originalRequest = https.request;

// 拦截 HTTPS 请求
https.request = function(options, callback) {
  console.log('\n=== 拦截到的 HTTPS 请求 ===');
  console.log('URL:', options.hostname + options.path);
  console.log('Method:', options.method || 'GET');
  console.log('Headers:');
  if (options.headers) {
    Object.keys(options.headers).forEach(key => {
      if (key.toLowerCase() === 'authorization') {
        const authHeader = options.headers[key];
        console.log(`  ${key}: ${authHeader.substring(0, 20)}...${authHeader.substring(authHeader.length - 10)}`);
        console.log(`  Authorization 长度: ${authHeader.length}`);
        console.log(`  Authorization 完整值: ${authHeader}`);
      } else {
        console.log(`  ${key}: ${options.headers[key]}`);
      }
    });
  }
  console.log('==========================\n');
  
  return originalRequest.call(this, options, callback);
};

async function compareRequests() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  console.log('=== 比较 SDK 和 Axios 的请求 ===\n');
  console.log(`API Key 长度: ${apiKey.length}`);
  console.log(`API Key 前缀: ${apiKey.substring(0, 20)}...`);
  console.log(`API Key 后缀: ...${apiKey.substring(apiKey.length - 10)}`);
  console.log('');

  // 测试 SDK
  console.log('1. 测试 OpenAI SDK:');
  try {
    const openai = new OpenAI({ apiKey: apiKey });
    await openai.models.list();
    console.log('  ✅ SDK 成功');
  } catch (error) {
    console.error('  ❌ SDK 失败:', error.message);
  }

  console.log('\n2. 测试 Axios:');
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    console.log('  ✅ Axios 成功');
  } catch (error) {
    console.error('  ❌ Axios 失败:', error.message);
  }
}

compareRequests().catch(console.error);


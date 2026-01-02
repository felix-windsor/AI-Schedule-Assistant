/**
 * 直接测试 OpenAI API Key（不使用代理，看看是否是 API Key 问题）
 */

const axios = require('axios');
const path = require('path');

// 加载环境变量
const envPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: envPath, override: true });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY 未设置');
  process.exit(1);
}

console.log('API Key 长度:', apiKey.length);
console.log('API Key 前缀:', apiKey.substring(0, 20) + '...');
console.log('API Key 后缀:', '...' + apiKey.substring(apiKey.length - 10));

async function testAPIKey() {
  try {
    console.log('\n测试 OpenAI API Key...');
    console.log('（注意：如果在中国大陆，这个测试可能会失败，因为无法直接连接 OpenAI）\n');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-2024-11-20',
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        max_tokens: 10,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✓ API Key 有效！');
    console.log('状态码:', response.status);
    console.log('响应:', JSON.stringify(response.data).substring(0, 200));
  } catch (error) {
    console.error('✗ API Key 测试失败');
    console.error('错误代码:', error.code);
    console.error('错误消息:', error.message);
    
    if (error.response) {
      console.error('HTTP 状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data));
      
      if (error.response.status === 401) {
        console.error('\n❌ API Key 无效或已过期！');
        console.error('请检查您的 API Key 是否正确');
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  网络连接问题（这是正常的，如果在中国大陆）');
      console.error('需要使用代理才能连接 OpenAI API');
    }
  }
}

testAPIKey();


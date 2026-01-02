/**
 * 测试代理连接
 */

const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const path = require('path');

// 加载环境变量
const envPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: envPath, override: true });

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

console.log('代理配置:', proxyUrl || '未配置');

async function testConnection() {
  try {
    const axiosConfig = {
      timeout: 30000,
    };

    if (proxyUrl) {
      console.log('使用代理:', proxyUrl);
      const agent = new HttpsProxyAgent(proxyUrl);
      axiosConfig.httpsAgent = agent;
      axiosConfig.httpAgent = agent;
    } else {
      console.log('未使用代理');
    }

    console.log('测试连接到 OpenAI API...');
    const response = await axios.get('https://api.openai.com/v1/models', {
      ...axiosConfig,
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY?.substring(0, 20)}...`,
      },
    });

    console.log('✓ 连接成功！');
    console.log('状态码:', response.status);
    console.log('响应数据长度:', JSON.stringify(response.data).length, '字符');
  } catch (error) {
    console.error('✗ 连接失败');
    console.error('错误代码:', error.code);
    console.error('错误消息:', error.message);
    
    if (error.response) {
      console.error('HTTP 状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data).substring(0, 200));
    }
  }
}

testConnection();


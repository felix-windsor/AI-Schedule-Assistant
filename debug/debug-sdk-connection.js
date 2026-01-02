/**
 * 深入调试 OpenAI SDK 连接问题
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const OpenAI = require('openai');

async function debugConnection() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  console.log('=== 调试 OpenAI SDK 连接问题 ===\n');
  console.log(`API Key 长度: ${apiKey.length}`);
  console.log(`API Key 前缀: ${apiKey.substring(0, 20)}...`);
  console.log('');

  // 测试 1: 基本配置
  console.log('测试 1: 基本配置');
  try {
    const openai1 = new OpenAI({ 
      apiKey: apiKey,
      baseURL: 'https://api.openai.com/v1',
    });
    
    console.log(`  baseURL: ${openai1.baseURL}`);
    console.log(`  尝试调用...`);
    
    const response = await openai1.models.list();
    console.log('  ✅ 成功！');
    console.log(`  模型数量: ${response.data.length}`);
  } catch (error) {
    console.error('  ❌ 失败');
    console.error(`  错误类型: ${error.constructor.name}`);
    console.error(`  错误消息: ${error.message}`);
    console.error(`  错误代码: ${error.code || 'N/A'}`);
    
    // 检查错误原因
    if (error.cause) {
      console.error(`  原因:`, error.cause);
      if (error.cause.code) {
        console.error(`  原因代码: ${error.cause.code}`);
      }
      if (error.cause.message) {
        console.error(`  原因消息: ${error.cause.message}`);
      }
    }
  }

  console.log('');

  // 测试 2: 使用不同的 HTTP 客户端配置
  console.log('测试 2: 检查网络连接');
  try {
    const https = require('https');
    const http = require('http');
    
    // 测试直接连接
    console.log('  测试 HTTPS 连接到 api.openai.com...');
    const testUrl = 'https://api.openai.com/v1/models';
    
    const axios = require('axios');
    const axiosResponse = await axios.get(testUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });
    console.log('  ✅ Axios 可以连接');
    console.log(`  响应状态: ${axiosResponse.status}`);
  } catch (error) {
    console.error('  ❌ Axios 连接失败');
    console.error(`  错误: ${error.message}`);
  }

  console.log('');

  // 测试 3: 检查 SDK 使用的 HTTP 客户端
  console.log('测试 3: 检查 SDK 内部 HTTP 客户端');
  try {
    // 尝试设置自定义 fetch（如果 SDK 支持）
    const openai3 = new OpenAI({ 
      apiKey: apiKey,
      baseURL: 'https://api.openai.com/v1',
      // 尝试设置超时
      timeout: 60000,
    });
    
    console.log('  使用自定义配置创建客户端');
    console.log(`  baseURL: ${openai3.baseURL}`);
    
    // 尝试调用
    const response = await openai3.models.list({
      timeout: 30000, // 30秒超时
    });
    console.log('  ✅ 成功！');
  } catch (error) {
    console.error('  ❌ 失败');
    console.error(`  错误: ${error.message}`);
    console.error(`  完整错误:`, error);
  }
}

debugConnection().catch(console.error);

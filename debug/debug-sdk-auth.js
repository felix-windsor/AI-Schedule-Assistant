/**
 * 深入诊断 OpenAI SDK 401 问题
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const OpenAI = require('openai');

async function debugSDKAuth() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  if (!apiKey) {
    console.error('❌ API Key 未设置');
    return;
  }

  console.log('=== OpenAI SDK 认证诊断 ===\n');
  console.log(`API Key 长度: ${apiKey.length}`);
  console.log(`API Key 前缀: ${apiKey.substring(0, 20)}...`);
  console.log(`API Key 后缀: ...${apiKey.substring(apiKey.length - 10)}`);
  console.log(`API Key 类型: ${apiKey.startsWith('sk-proj-') ? '项目级别 (sk-proj-)' : '标准 (sk-)'}`);
  console.log('');

  // 测试 1: 直接创建客户端
  console.log('测试 1: 直接创建 OpenAI 客户端');
  try {
    const openai1 = new OpenAI({ apiKey: apiKey });
    console.log('  ✓ 客户端创建成功');
    
    // 尝试调用
    console.log('  尝试调用 models.list()...');
    const response1 = await openai1.models.list();
    console.log('  ✅ SDK 调用成功！');
    console.log(`  可用模型数量: ${response1.data.length}`);
  } catch (error) {
    console.error('  ❌ SDK 调用失败');
    console.error(`  错误代码: ${error.status || error.code || 'N/A'}`);
    console.error(`  错误信息: ${error.message}`);
    if (error.response) {
      console.error(`  响应状态: ${error.response.status}`);
      console.error(`  响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  console.log('');

  // 测试 2: 使用不同的初始化方式
  console.log('测试 2: 使用不同的初始化方式');
  try {
    // 方式 A: 直接传入字符串
    const openai2a = new OpenAI({ apiKey });
    await openai2a.models.list();
    console.log('  ✅ 方式 A (直接传入) 成功');
  } catch (error) {
    console.error('  ❌ 方式 A 失败:', error.message);
  }

  try {
    // 方式 B: 使用环境变量
    process.env.OPENAI_API_KEY = apiKey;
    const openai2b = new OpenAI();
    await openai2b.models.list();
    console.log('  ✅ 方式 B (环境变量) 成功');
  } catch (error) {
    console.error('  ❌ 方式 B 失败:', error.message);
  }

  console.log('');

  // 测试 3: 检查 SDK 版本和配置
  console.log('测试 3: 检查 SDK 版本和配置');
  try {
    const openaiPackage = require('../backend/node_modules/openai/package.json');
    console.log(`  SDK 版本: ${openaiPackage.version}`);
  } catch (error) {
    console.log('  无法读取 SDK 版本信息');
  }
  
  // 尝试查看 SDK 内部配置
  try {
    const openai3 = new OpenAI({ apiKey: apiKey });
    // 检查客户端内部状态
    console.log('  客户端配置:');
    console.log(`    baseURL: ${openai3.baseURL || 'default'}`);
    // 注意：apiKey 可能是私有的，无法直接访问
  } catch (error) {
    console.error('  无法检查客户端配置:', error.message);
  }

  console.log('');

  // 测试 4: 对比 axios 调用
  console.log('测试 4: 对比 axios 调用（应该成功）');
  try {
    const axios = require('axios');
    const axiosResponse = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    console.log('  ✅ Axios 调用成功');
    console.log(`  可用模型数量: ${axiosResponse.data.data.length}`);
  } catch (error) {
    console.error('  ❌ Axios 调用失败:', error.message);
  }

  console.log('\n=== 诊断完成 ===');
}

debugSDKAuth().catch(console.error);


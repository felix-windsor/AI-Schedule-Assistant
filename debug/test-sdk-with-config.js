/**
 * 测试配置后的 SDK
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const { getOpenAIClient } = require('../backend/src/config/openai');

async function test() {
  console.log('=== 测试配置后的 SDK ===\n');
  
  try {
    const openai = getOpenAIClient();
    
    console.log(`baseURL: ${openai.baseURL}`);
    console.log(`timeout: ${openai.timeout}ms`);
    console.log(`maxRetries: ${openai.maxRetries}`);
    console.log('\n尝试调用 models.list()...\n');
    
    const response = await openai.models.list();
    
    console.log('✅ SDK 调用成功！');
    console.log(`可用模型数量: ${response.data.length}`);
    console.log('\n前 5 个模型:');
    response.data.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id}`);
    });
    
  } catch (error) {
    console.error('❌ SDK 调用失败:');
    console.error(`  错误类型: ${error.constructor?.name}`);
    console.error(`  错误消息: ${error.message}`);
    
    if (error.cause) {
      console.error(`  原因: ${error.cause.message || error.cause}`);
    }
  }
}

test();


/**
 * 测试 SDK 修复是否有效
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const { getOpenAIClient } = require('../backend/src/config/openai');

async function testSDK() {
  console.log('=== 测试 OpenAI SDK 修复 ===\n');
  
  try {
    const openai = getOpenAIClient();
    
    console.log(`baseURL: ${openai.baseURL}`);
    console.log('尝试调用 models.list()...\n');
    
    const response = await openai.models.list();
    
    console.log('✅ SDK 调用成功！');
    console.log(`可用模型数量: ${response.data.length}`);
    console.log('\n前 5 个模型:');
    response.data.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id}`);
    });
    
    console.log('\n✅ 问题已修复！SDK 现在可以正常工作了。');
    
  } catch (error) {
    console.error('❌ SDK 调用失败:');
    console.error(`  错误类型: ${error.constructor.name}`);
    console.error(`  错误消息: ${error.message}`);
    console.error(`  baseURL: ${error.baseURL || 'N/A'}`);
    
    if (error.status) {
      console.error(`  HTTP 状态: ${error.status}`);
    }
    
    if (error.cause) {
      console.error(`  原因: ${error.cause.message || error.cause}`);
    }
  }
}

testSDK();


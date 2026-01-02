/**
 * 测试 OpenAI API Key 是否有效
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const OpenAI = require('openai');

async function testAPIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未设置');
    return;
  }

  console.log(`API Key 长度: ${apiKey.length}`);
  console.log(`API Key 前缀: ${apiKey.substring(0, 10)}...`);
  console.log(`API Key 后缀: ...${apiKey.substring(apiKey.length - 4)}`);
  console.log('');

  try {
    const openai = new OpenAI({ apiKey: apiKey });
    
    console.log('正在测试 API Key...');
    
    // 尝试一个简单的 API 调用
    const response = await openai.models.list();
    
    console.log('✅ API Key 有效！');
    console.log(`可用模型数量: ${response.data.length}`);
    console.log('');
    console.log('前 5 个可用模型:');
    response.data.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id}`);
    });
    
  } catch (error) {
    console.error('❌ API Key 测试失败:');
    console.error(`   错误代码: ${error.status || error.code || 'N/A'}`);
    console.error(`   错误信息: ${error.message}`);
    
    if (error.status === 401) {
      console.error('');
      console.error('可能的原因:');
      console.error('  1. API Key 已过期或被撤销');
      console.error('  2. API Key 格式不正确');
      console.error('  3. API Key 不属于当前账户');
      console.error('  4. 账户余额不足或已暂停');
      console.error('');
      console.error('解决方案:');
      console.error('  1. 访问 https://platform.openai.com/api-keys 检查 API Key');
      console.error('  2. 创建新的 API Key 并更新 .env 文件');
      console.error('  3. 检查账户状态和余额');
    }
  }
}

testAPIKey();


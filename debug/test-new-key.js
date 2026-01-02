/**
 * 快速测试新的 API Key
 * 使用方法: node test-new-key.js <your-api-key>
 */

const OpenAI = require('openai');

const apiKey = process.argv[2];

if (!apiKey) {
  console.log('使用方法: node test-new-key.js <your-api-key>');
  console.log('');
  console.log('示例:');
  console.log('  node test-new-key.js sk-proj-xxxxxxxxxxxxx');
  process.exit(1);
}

async function testKey() {
  console.log(`测试 API Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 10)}`);
  console.log(`Key 长度: ${apiKey.length} 字符\n`);

  try {
    const openai = new OpenAI({ apiKey: apiKey.trim() });
    
    console.log('正在测试...');
    const response = await openai.models.list();
    
    console.log('\n✅ API Key 有效！');
    console.log(`可用模型数量: ${response.data.length}`);
    console.log('\n前 5 个可用模型:');
    response.data.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id}`);
    });
    
    console.log('\n✅ 这个 Key 可以使用，请更新 .env 文件中的 OPENAI_API_KEY');
    
  } catch (error) {
    console.error('\n❌ API Key 测试失败:');
    console.error(`   错误: ${error.message}`);
    
    if (error.status === 401) {
      console.error('\n这个 Key 无效，可能的原因:');
      console.error('  1. Key 已过期或被撤销');
      console.error('  2. Key 不属于当前账户');
      console.error('  3. 账户余额不足');
    }
  }
}

testKey();


/**
 * 诊断 API Key 问题
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const OpenAI = require('openai');

function diagnoseAPIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未设置');
    return;
  }

  console.log('=== API Key 诊断 ===\n');
  console.log(`长度: ${apiKey.length} 字符`);
  console.log(`前缀: ${apiKey.substring(0, 15)}...`);
  console.log(`后缀: ...${apiKey.substring(apiKey.length - 15)}`);
  console.log('');

  // 检查格式
  console.log('格式检查:');
  if (apiKey.startsWith('sk-')) {
    console.log('  ✓ 以 sk- 开头');
  } else {
    console.log('  ❌ 不以 sk- 开头');
  }

  if (apiKey.startsWith('sk-proj-')) {
    console.log('  ✓ 项目级别 Key (sk-proj-)');
  }

  // 检查隐藏字符
  console.log('\n隐藏字符检查:');
  const hasWhitespace = /\s/.test(apiKey);
  const hasNewline = /\n|\r/.test(apiKey);
  const hasSpecialChars = /[^\w\-]/.test(apiKey.replace(/^sk-proj?-/, ''));
  
  if (hasWhitespace) {
    console.log('  ⚠️  包含空格或制表符');
    const spaces = apiKey.match(/\s/g);
    console.log(`     找到 ${spaces ? spaces.length : 0} 个空白字符`);
  } else {
    console.log('  ✓ 无空白字符');
  }

  if (hasNewline) {
    console.log('  ⚠️  包含换行符');
  } else {
    console.log('  ✓ 无换行符');
  }

  // 显示字符编码
  console.log('\n字符编码检查:');
  const firstChar = apiKey.charCodeAt(0);
  const lastChar = apiKey.charCodeAt(apiKey.length - 1);
  console.log(`  第一个字符: '${apiKey[0]}' (Unicode: ${firstChar})`);
  console.log(`  最后一个字符: '${apiKey[apiKey.length - 1]}' (Unicode: ${lastChar})`);

  // 清理后的 Key
  const cleanedKey = apiKey.trim().replace(/\s+/g, '');
  if (cleanedKey !== apiKey) {
    console.log('\n⚠️  发现格式问题，清理后的 Key:');
    console.log(`  原长度: ${apiKey.length}`);
    console.log(`  清理后长度: ${cleanedKey.length}`);
    console.log(`  清理后前缀: ${cleanedKey.substring(0, 15)}...`);
    console.log(`  清理后后缀: ...${cleanedKey.substring(cleanedKey.length - 15)}`);
  }

  console.log('\n=== 测试 API Key ===\n');

  // 使用清理后的 Key 测试
  const keyToTest = cleanedKey !== apiKey ? cleanedKey : apiKey;
  
  testAPIKey(keyToTest);
}

async function testAPIKey(key) {
  try {
    const openai = new OpenAI({ apiKey: key });
    
    console.log('正在测试 API Key...');
    
    const response = await openai.models.list();
    
    console.log('\n✅ API Key 有效！');
    console.log(`可用模型数量: ${response.data.length}`);
    console.log('\n前 5 个可用模型:');
    response.data.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id}`);
    });
    
    // 如果清理后的 Key 有效，提示用户更新
    if (key !== process.env.OPENAI_API_KEY) {
      console.log('\n⚠️  注意: 清理后的 Key 有效，但 .env 文件中的 Key 有格式问题');
      console.log('建议更新 .env 文件中的 OPENAI_API_KEY 为清理后的值');
    }
    
  } catch (error) {
    console.error('\n❌ API Key 测试失败:');
    console.error(`   错误代码: ${error.status || error.code || 'N/A'}`);
    console.error(`   错误信息: ${error.message}`);
    
    if (error.status === 401) {
      console.error('\n可能的原因:');
      console.error('  1. API Key 已过期或被撤销');
      console.error('  2. API Key 格式不正确（可能包含隐藏字符）');
      console.error('  3. API Key 不属于当前账户');
      console.error('  4. 账户余额不足或已暂停');
      console.error('\n建议:');
      console.error('  1. 从 OpenAI 平台重新复制 API Key');
      console.error('  2. 确保复制时没有包含额外的空格或换行');
      console.error('  3. 检查账户状态和余额');
    }
  }
}

diagnoseAPIKey();


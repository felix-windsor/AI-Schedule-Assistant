/**
 * 帮助更新 API Key 的脚本
 * 使用方法: node update-api-key.js <your-api-key>
 */

const fs = require('fs');
const path = require('path');

const apiKey = process.argv[2];

if (!apiKey) {
  console.log('使用方法: node update-api-key.js <your-api-key>');
  console.log('');
  console.log('示例:');
  console.log('  node update-api-key.js sk-proj-xxxxxxxxxxxxx');
  console.log('');
  console.log('或者手动编辑 backend/.env 文件，更新 OPENAI_API_KEY 的值');
  process.exit(1);
}

// 验证 API Key 格式
if (!apiKey.startsWith('sk-')) {
  console.error('❌ 错误: API Key 应该以 "sk-" 或 "sk-proj-" 开头');
  process.exit(1);
}

if (apiKey.length < 40 || apiKey.length > 100) {
  console.warn(`⚠️  警告: API Key 长度异常 (${apiKey.length} 字符)`);
  console.warn('   正常的 API Key 长度应该在 51-60 个字符之间');
  console.warn('   如果确认 Key 正确，可以继续');
  console.log('');
}

// 读取 .env 文件
const envPath = path.resolve(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.error('❌ 错误: .env 文件不存在');
  process.exit(1);
}

// 更新 API Key
const keyPattern = /^OPENAI_API_KEY=.*$/m;
if (keyPattern.test(envContent)) {
  envContent = envContent.replace(keyPattern, `OPENAI_API_KEY=${apiKey}`);
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ API Key 已更新');
  console.log(`   新 Key 长度: ${apiKey.length} 字符`);
  console.log(`   新 Key 前缀: ${apiKey.substring(0, 10)}...`);
  console.log('');
  console.log('请重启后端服务以使更改生效');
} else {
  console.error('❌ 错误: 在 .env 文件中找不到 OPENAI_API_KEY');
  process.exit(1);
}


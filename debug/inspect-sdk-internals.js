/**
 * 检查 OpenAI SDK 内部实现
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

async function inspectSDK() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  console.log('=== 检查 OpenAI SDK 内部实现 ===\n');
  
  // 1. 检查 SDK 版本
  try {
    const packagePath = path.join(__dirname, 'node_modules', 'openai', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`SDK 版本: ${packageJson.version}`);
    console.log(`SDK 描述: ${packageJson.description}`);
    console.log('');
  } catch (error) {
    console.error('无法读取 SDK 信息:', error.message);
  }

  // 2. 检查 SDK 的依赖
  try {
    const packagePath = path.join(__dirname, 'node_modules', 'openai', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log('SDK 依赖:');
    if (packageJson.dependencies) {
      Object.keys(packageJson.dependencies).forEach(dep => {
        if (dep.includes('fetch') || dep.includes('http') || dep.includes('undici') || dep.includes('node')) {
          console.log(`  - ${dep}: ${packageJson.dependencies[dep]}`);
        }
      });
    }
    console.log('');
  } catch (error) {
    console.error('无法读取依赖信息:', error.message);
  }

  // 3. 创建客户端并检查
  console.log('创建 OpenAI 客户端...');
  // 明确指定 baseURL，防止 SDK 自动检测
  const openai = new OpenAI({ 
    apiKey: apiKey,
    baseURL: 'https://api.openai.com/v1',
  });
  
  // 检查客户端属性
  console.log('客户端属性:');
  console.log(`  baseURL: ${openai.baseURL || 'default (https://api.openai.com/v1)'}`);
  console.log(`  apiKey 类型: ${typeof openai.apiKey}`);
  console.log(`  apiKey 长度: ${openai.apiKey ? openai.apiKey.length : 'N/A'}`);
  if (openai.apiKey) {
    console.log(`  apiKey 前缀: ${openai.apiKey.substring(0, 20)}...`);
    console.log(`  apiKey 后缀: ...${openai.apiKey.substring(openai.apiKey.length - 10)}`);
  }
  console.log('');

  // 4. 尝试调用并捕获详细错误
  console.log('尝试调用 models.list()...');
  try {
    const response = await openai.models.list();
    console.log('✅ 调用成功！');
    console.log(`模型数量: ${response.data.length}`);
  } catch (error) {
    console.error('❌ 调用失败');
    console.error(`错误类型: ${error.constructor.name}`);
    console.error(`错误消息: ${error.message}`);
    console.error(`HTTP 状态: ${error.status || error.statusCode || 'N/A'}`);
    console.error(`错误代码: ${error.code || 'N/A'}`);
    
    // 检查错误对象的所有属性
    console.log('\n错误对象属性:');
    Object.keys(error).forEach(key => {
      if (key !== 'stack') {
        const value = error[key];
        if (typeof value === 'object' && value !== null) {
          console.log(`  ${key}:`, JSON.stringify(value, null, 2).substring(0, 200));
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    });

    // 检查是否有 response 对象
    if (error.response) {
      console.log('\n响应对象:');
      console.log(`  状态码: ${error.response.status}`);
      console.log(`  状态文本: ${error.response.statusText}`);
      if (error.response.data) {
        console.log(`  响应数据:`, JSON.stringify(error.response.data, null, 2));
      }
      if (error.response.headers) {
        console.log(`  响应头:`, JSON.stringify(error.response.headers, null, 2));
      }
    }

    // 检查是否有 request 对象
    if (error.request) {
      console.log('\n请求对象:');
      console.log(`  请求方法: ${error.request.method || 'N/A'}`);
      console.log(`  请求 URL: ${error.request.url || error.request.path || 'N/A'}`);
      if (error.request.headers) {
        console.log('  请求头:');
        Object.keys(error.request.headers).forEach(key => {
          if (key.toLowerCase() === 'authorization') {
            const auth = error.request.headers[key];
            console.log(`    ${key}: ${auth.substring(0, 20)}...${auth.substring(auth.length - 10)} (长度: ${auth.length})`);
          } else {
            console.log(`    ${key}: ${error.request.headers[key]}`);
          }
        });
      }
    }
  }

  console.log('\n=== 检查完成 ===');
}

inspectSDK().catch(console.error);


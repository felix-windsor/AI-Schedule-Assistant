const OpenAI = require('openai');
const path = require('path');

// 确保从 backend 目录加载 .env 文件
// 使用 override: true 让 .env 文件中的值覆盖系统环境变量
// __dirname 是 backend/src/config，所以需要回到 backend 目录
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath, override: true });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// 获取 API Key（每次调用时重新读取，确保获取最新值）
function getAPIKey() {
  // 重新加载环境变量
  const envPath = path.resolve(__dirname, '../.env');
  require('dotenv').config({ path: envPath, override: true });
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  
  const trimmedKey = apiKey.trim();
  
  // 调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] API Key 长度: ${trimmedKey.length}`);
    console.log(`[DEBUG] API Key 前缀: ${trimmedKey.substring(0, 20)}...`);
    console.log(`[DEBUG] API Key 后缀: ...${trimmedKey.substring(trimmedKey.length - 10)}`);
  }
  
  return trimmedKey;
}

// 创建 OpenAI 客户端（延迟初始化，使用函数获取 Key）
function getOpenAIClient() {
  const apiKey = getAPIKey();
  return new OpenAI({ 
    apiKey: apiKey,
    // 明确指定 baseURL，防止 SDK 自动检测到错误的 API 端点
    baseURL: 'https://api.openai.com/v1',
  });
}

// 为了向后兼容，也导出一个默认的客户端实例
const openai = getOpenAIClient();

// 支持的模型列表（支持 Structured Outputs）
const SUPPORTED_MODELS = [
  'gpt-4o-2024-08-06',
  'gpt-4o-2024-11-20',
  'gpt-4o-mini-2024-07-18',
  'gpt-4o',
];

// 默认模型
const DEFAULT_MODEL = 'gpt-4o-2024-08-06';

// 获取配置的模型
function getModel() {
  // 重新加载环境变量（确保获取最新值）
  // 使用 override: true 让 .env 文件中的值覆盖系统环境变量
  // __dirname 是 backend/src/config，所以需要回到 backend 目录
  const envPath = path.resolve(__dirname, '../.env');
  require('dotenv').config({ path: envPath, override: true });
  
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  
  // 调试信息：显示实际使用的模型
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] 使用的模型: ${model}`);
    console.log(`[DEBUG] OPENAI_MODEL 环境变量: ${process.env.OPENAI_MODEL || '(未设置，使用默认值)'}`);
  }
  
  // 验证模型是否支持 Structured Outputs
  if (!SUPPORTED_MODELS.includes(model)) {
    console.warn(`警告: 模型 ${model} 可能不支持 Structured Outputs，建议使用: ${SUPPORTED_MODELS.join(', ')}`);
  } else {
    console.log(`✓ 模型 ${model} 支持 Structured Outputs`);
  }
  
  return model;
}

module.exports = {
  openai,
  getOpenAIClient, // 导出函数，可以在需要时获取新的客户端实例
  getAPIKey, // 导出函数，可以获取 API Key
  getModel,
  SUPPORTED_MODELS,
  DEFAULT_MODEL,
};


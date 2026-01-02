const OpenAI = require('openai');
const path = require('path');

// 确保从 backend 目录加载 .env 文件
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  const envPath = path.resolve(__dirname, '../../.env');
  require('dotenv').config({ path: envPath });
  
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
  getModel,
  SUPPORTED_MODELS,
  DEFAULT_MODEL,
};


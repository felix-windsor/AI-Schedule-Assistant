const OpenAI = require('openai');
require('dotenv').config();

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
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  
  // 验证模型是否支持 Structured Outputs
  if (!SUPPORTED_MODELS.includes(model)) {
    console.warn(`警告: 模型 ${model} 可能不支持 Structured Outputs，建议使用: ${SUPPORTED_MODELS.join(', ')}`);
  }
  
  return model;
}

module.exports = {
  openai,
  getModel,
  SUPPORTED_MODELS,
  DEFAULT_MODEL,
};


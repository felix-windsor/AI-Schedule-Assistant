# AI 日程助手

使用 AI 解析自然语言并自动生成日历事件的智能日程助手。

## 项目概述

用户用自然语言描述任务（如"明天下午3点和老板开会"），AI 自动解析并生成可跨平台使用的日历事件。

### 核心特性

- ⚡ **快速**: "明天下午3点开会" → 2秒生成日程
- 🎯 **准确**: Structured Outputs 保证 100% 格式正确
- 🌐 **跨平台**: Web + PWA，未来可扩展到原生 App
- 🔗 **兼容**: 支持导出到 Google Calendar/Apple Calendar/Outlook

## 技术栈

### 后端
- Node.js + Express
- OpenAI API (Structured Outputs)
- FullCalendar 兼容的数据格式

### 前端（待开发）
- React + FullCalendar
- Tailwind CSS
- PWA 支持

## 快速开始

### 后端

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 文件，填入 OPENAI_API_KEY
npm start
```

后端服务将在 `http://localhost:5000` 启动。

### 测试页面

1. 启动后端服务
2. 用浏览器打开 `test-page/index.html`
3. 输入自然语言，点击"解析并添加到日历"

## 项目结构

```
AI-Schedule-Assistant/
├── backend/              # 后端 API
│   ├── src/            # 源代码
│   ├── tests/          # 测试文件
│   └── package.json
├── test-page/          # 测试页面（HTML + FullCalendar）
│   ├── index.html
│   └── styles.css
└── README.md
```

## API 文档

详见 [backend/README.md](backend/README.md)

## 开发计划

- [x] Phase 0: 核心能力验证
- [x] Phase 1: 后端 API 实现
- [x] Phase 2: 测试页面
- [ ] Phase 3: React 前端（使用 Vercel v0）
- [ ] Phase 4: PWA 支持
- [ ] Phase 5: 数据持久化

## 许可证

MIT

# .gitignore 配置说明

## ✅ 已完成的配置

我已经在项目根目录创建了完整的 `.gitignore` 文件，它会忽略以下内容：

### 📦 依赖和构建产物
- `node_modules/` - 所有依赖包（包括 frontend 和 backend）
- `.next/` - Next.js 构建输出
- `out/` - Next.js 导出目录
- `build/` - 构建产物
- `dist/` - 分发目录

### 🔐 环境变量和敏感信息
- `.env` - 环境变量文件
- `.env.local` - 本地环境变量
- `.env.*.local` - 各种环境的本地配置

### 🗑️ 临时和缓存文件
- `*.log` - 日志文件
- `.cache/` - 缓存目录
- `.turbo/` - Turbo 缓存
- `*.tsbuildinfo` - TypeScript 构建信息

### 🛠️ IDE 和系统文件
- `.vscode/` - VS Code 配置
- `.idea/` - IntelliJ IDEA 配置
- `.DS_Store` - macOS 系统文件
- `Thumbs.db` - Windows 缩略图缓存

### 🐛 调试文件
- `debug/` - 调试脚本目录

## 📋 如果文件已经被 Git 跟踪

如果 `node_modules` 或其他应该被忽略的文件已经被 Git 跟踪，需要从 Git 缓存中移除：

```bash
# 从 Git 缓存中移除所有 node_modules（但保留本地文件）
git rm -r --cached frontend/node_modules
git rm -r --cached backend/node_modules

# 从 Git 缓存中移除 .next 目录
git rm -r --cached frontend/.next

# 提交更改
git add .gitignore
git commit -m "Add .gitignore and remove tracked node_modules"
```

## 🔍 验证 .gitignore 是否生效

检查特定文件是否被忽略：

```bash
# 检查 node_modules 是否被忽略
git check-ignore -v frontend/node_modules
git check-ignore -v backend/node_modules

# 查看所有被忽略的文件（不会显示在 git status 中）
git status --ignored
```

## 📊 查看仓库大小

如果担心仓库太大，可以检查：

```bash
# 查看 Git 仓库大小
du -sh .git

# 查看所有文件大小（不包括 .git）
du -sh --exclude=.git .
```

## ⚠️ 注意事项

1. **不要提交 `node_modules`**：这些文件可以通过 `npm install` 或 `pnpm install` 重新生成
2. **不要提交 `.env` 文件**：包含敏感信息，使用 `.env.example` 作为模板
3. **不要提交构建产物**：`.next/`、`build/`、`dist/` 等都可以重新生成
4. **提交锁文件**：`package-lock.json` 或 `pnpm-lock.yaml` 通常应该提交，以确保依赖版本一致

## 🎯 推荐的文件结构

应该提交的文件：
- ✅ 源代码（`.ts`, `.tsx`, `.js`, `.jsx` 等）
- ✅ 配置文件（`package.json`, `tsconfig.json`, `next.config.mjs` 等）
- ✅ 锁文件（`package-lock.json`, `pnpm-lock.yaml`）
- ✅ 文档（`README.md`, `*.md`）
- ✅ 公共资源（`public/` 目录）

不应该提交的文件：
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `.env`
- ❌ 构建产物
- ❌ IDE 配置
- ❌ 日志文件


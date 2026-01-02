# 网络连接问题排查指南

## 🔴 错误：`ECONNREFUSED` 或 `connect ECONNREFUSED`

这个错误表示无法连接到 OpenAI API 服务器。

## 🔍 可能的原因

1. **防火墙阻止连接**
   - Windows 防火墙或第三方防火墙软件可能阻止了出站连接
   - 企业网络可能有防火墙规则

2. **需要代理服务器**
   - 在中国大陆，通常需要代理才能访问 OpenAI API
   - 公司网络可能需要配置代理

3. **DNS 解析问题**
   - 无法解析 `api.openai.com` 域名
   - DNS 服务器配置问题

4. **网络连接问题**
   - 网络不稳定
   - ISP 限制

## 🛠️ 解决方案

### 方案 1：配置代理（推荐）

如果在中国大陆或需要代理，可以配置 axios 使用代理：

1. **安装代理工具**（如 Clash、V2Ray 等）

2. **配置环境变量**：

在 `backend/.env` 文件中添加：

```env
# HTTP 代理（如果使用 HTTP 代理）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890

# 或 SOCKS5 代理（如果使用 SOCKS5 代理）
# 注意：axios 默认不支持 SOCKS5，需要使用 https-proxy-agent
```

3. **修改代码以支持代理**：

需要安装 `https-proxy-agent`：

```bash
cd backend
npm install https-proxy-agent
```

然后在 `backend/src/controllers/parse.controller.js` 中添加代理支持。

### 方案 2：检查防火墙设置

1. **Windows 防火墙**：
   - 打开"Windows Defender 防火墙"
   - 检查出站规则
   - 确保 Node.js 或您的应用程序被允许访问网络

2. **第三方防火墙**：
   - 检查您的防病毒软件或防火墙软件
   - 临时禁用防火墙测试是否解决问题

### 方案 3：测试网络连接

使用以下命令测试是否可以连接到 OpenAI API：

```bash
# 测试 DNS 解析
nslookup api.openai.com

# 测试 HTTPS 连接
curl -v https://api.openai.com/v1/models

# 或使用 PowerShell
Test-NetConnection api.openai.com -Port 443
```

### 方案 4：使用 VPN

如果代理配置复杂，可以使用 VPN：
- 连接到支持 OpenAI 的 VPN 服务器
- 确保 VPN 路由所有流量

## 📝 快速测试

运行以下命令测试 OpenAI API 连接：

```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o-2024-11-20",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }'
```

如果这个命令也失败，说明是网络问题，不是代码问题。

## 🔧 代码修改（添加代理支持）

如果需要添加代理支持，我可以帮您修改代码。请告诉我：
1. 您使用的代理类型（HTTP/HTTPS 或 SOCKS5）
2. 代理地址和端口

## 📞 获取帮助

如果以上方案都无法解决问题，请提供：
1. 您的网络环境（是否在中国大陆、是否在公司网络等）
2. 是否已配置代理或 VPN
3. `curl` 测试的结果


# 环境变量配置说明

## 创建 .env.local 文件

由于 `.env.local` 文件被 gitignore 忽略，请手动创建此文件。

在 `frontend` 目录下创建 `.env.local` 文件，内容如下：

```env
# 后端 API 地址配置
# 开发环境：本地后端服务
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# 生产环境配置（部署时修改）
# NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

## 说明

- `NEXT_PUBLIC_API_BASE_URL` 是 Next.js 的环境变量，必须以 `NEXT_PUBLIC_` 开头才能在客户端使用
- 开发环境默认使用 `http://localhost:5000`（后端服务地址）
- 确保后端服务运行在配置的地址上
- 修改环境变量后需要重启 Next.js 开发服务器

## 验证配置

启动前端服务后，在浏览器控制台应该能看到：
```
[API] 请求地址: http://localhost:5000/api/v1/events/parse
```

如果看到这个日志，说明环境变量配置成功。


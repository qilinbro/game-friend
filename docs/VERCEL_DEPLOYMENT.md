# 部署到 Vercel 指南

本文档说明如何将游戏搭子项目部署到 Vercel 平台。

## 前置要求

- Vercel 账号（[https://vercel.com](https://vercel.com)）
- GitHub 账号（用于代码托管）
- MySQL 数据库（推荐使用 PlanetScale）
- SecondMe 应用凭据

## 部署步骤

### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 配置 MySQL 数据库

推荐使用 [PlanetScale](https://planetscale.com/) 作为 Vercel 的 MySQL 数据库提供商。

1. 访问 [https://vercel.com/marketplace](https://vercel.com/marketplace)
2. 搜索 "PlanetScale"
3. 点击 "Add" 或 "Install" 按钮
4. 创建一个新的数据库实例
5. 获取数据库连接字符串（包含在 `.env` 中的 `DATABASE_URL`）

### 4. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `DATABASE_URL` | MySQL 数据库连接字符串 | ✅ |
| `SECONDME_API_BASE_URL` | SecondMe API 基础 URL | ✅ |
| `SECONDME_CLIENT_ID` | SecondMe 应用 Client ID | ✅ |
| `SECONDME_CLIENT_SECRET` | SecondMe 应用 Client Secret | ✅ |

**获取 SecondMe 凭据：**

1. 访问 [SecondMe 开发者平台](https://second.me/)
2. 创建或选择你的应用
3. 在应用设置中获取 Client ID 和 Client Secret

### 5. 初始化数据库

在 Vercel 部署前，需要在本地运行数据库迁移：

```bash
npx prisma db push
```

### 6. 部署到 Vercel

#### 方式一：使用 Vercel CLI

```bash
vercel prod
```

#### 方式二：使用 Vercel Dashboard

1. 将代码推送到 GitHub 仓库
2. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 "Add New Project"
4. 导入你的 GitHub 仓库
5. (Vercel 会自动检测到 Next.js 项目)
6. 配置环境变量（见步骤 4）
7. 点击 "Deploy"

## Vercel 特定配置

### vercel.json

在项目根目录创建 `vercel.json` 文件以优化部署：

```json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "prisma generate && next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

### .gitignore

确保以下文件不会被提交到 Git：

```
node_modules/
.next/
.env
.env.local
.prisma/
```

## 数据库配置（推荐：PlanetScale）

### PlanetScale 配置步骤

1. 在 Vercel Marketplace 安装 PlanetScale
2. 创建数据库时选择：
   - **Provider**: MySQL
   - **Region**: 选择离用户最近的区域（推荐香港或新加坡）
   - **Plan**: 免费或按需付费

3. 数据库创建后，Vercel 会自动添加 `DATABASE_URL` 环境变量

### 数据库迁移

Vercel 部署后，需要运行数据库初始化：

**方式一：通过 Vercel 部署钩子**

1. 在 Vercel 项目设置中添加部署命令：
   ```bash
   npx prisma db push
   ```

**方式二：手动初始化**

部署完成后，通过 SSH 或 Vercel CLI 运行：

```bash
vercel run npx prisma db push --prod
```

## SecondMe API 配置

### OAuth 回调 URL

确保 SecondMe 应用中的回调 URL 设置正确：

```
https://your-domain.vercel.app/api/auth/callback
```

### 必需权限

确保应用已授权以下权限：
- `user.info` - 用户基础信息
- `user.info.shades` - 用户兴趣标签
- `chat` - 聊天功能
- `note.add` - 添加笔记

## 常见问题

### Q1: 部署后出现数据库连接错误

**原因：** `DATABASE_URL` 环境变量未正确配置

**解决：**
1. 检查 Vercel Dashboard 中的环境变量
2. 确保变量名是 `DATABASE_URL`（全大写）
3. 重新部署项目

### Q2: Prisma Client 生成失败

**原因：** 构建过程中没有先运行 Prisma 生成

**解决：**
在 `vercel.json` 中设置正确的构建命令：
```json
{
  "buildCommand": "prisma generate && next build"
}
```

### Q3: 静态资源（图片）404

**原因：** `public` 目录下的资源未正确部署

**解决：**
1. 确保所有图片文件都在 `public/pictures/` 目录下
2. 重新部署

### Q4: SecondMe OAuth 回调失败

**原因：** 回调 URL 不匹配或端口问题

**解决：**
1. 确保 SecondMe 应用中配置的回调 URL 与 Vercel 域名一致
2. 回调 URL 格式：`https://your-domain.vercel.app/api/auth/callback`
3. 重新生成 SecondMe 应用凭据

## 性能优化

### 启用边缘函数

Vercel 默认将 Next.js API 路由部署为边缘函数，这是最佳实践。

### 图片优化

建议将图片托管在 CDN 上：
- 使用 Vercel Blob 存储用户头像
- 使用专业的图片 CDN（如 Cloudinary）

### 环境变量优化

在 Vercel Dashboard 中设置以下环境变量：

```
NODE_ENV=production
NEXT_PUBLIC_VERCEL_URL=https://your-domain.vercel.app
```

## 监控和日志

### Vercel 日志

1. 访问项目 Dashboard
2. 点击 "Logs" 标签页
3. 选择具体的部署版本查看日志

### 错误追踪

集成 Sentry 等错误追踪服务：

```bash
npm install @sentry/nextjs
```

## 域名和 SSL

Vercel 自动提供：
- `.vercel.app` 子域
- 自定义域配置（需要 DNS 记录）
- 自动 SSL/TLS 证书

## 持续部署（CD）

设置持续部署流程：

1. 连接 GitHub 仓库
2. 设置部署触发条件：
   - 推送到 `main` 分支
   - 或 Pull Request 合并
3. Vercel 自动检测变更并部署

## 回滚

如果部署出现问题：

```bash
# 列出最近的部署
vercel ls

# 回滚到上一个版本
vercel rollback [deployment-url]
```

## 检查清单

部署前检查：

- [ ] 所有环境变量已配置
- [ ] 数据库连接字符串有效
- [ ] Prisma schema 已同步
- [ ] SecondMe 回调 URL 正确
- [ ] 图片资源在 `public` 目录下
- [ ] `.gitignore` 文件已正确配置

部署后检查：

- [ ] 应用可访问
- [ ] 数据库连接正常
- [ ] OAuth 登录流程正常
- [ ] 静态资源正常加载
- [ ] API 端点响应正常

## 参考资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Prisma 在 Vercel 上的部署](https://www.prisma.io/docs/guides/deployment/vercel)
- [PlanetScale 文档](https://docs.planetscale.com/)

## 联系支持

如遇到部署问题，请联系：

- Vercel 支持: https://vercel.com/support
- PlanetScale 支持: https://planetscale.com/support
- SecondMe 支持: 查看 SecondMe API 文档

---

**最后更新:** 2026-03-19

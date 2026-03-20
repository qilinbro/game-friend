# 部署前清单

## 数据库迁移准备

### ✅ 已完成的工作

1. **添加了 Prisma 迁移脚本** (`package.json`)
   - `prisma:migrate`: 执行数据库迁移
   - `prisma:generate`: 生成 Prisma 客户端

2. **创建了初始迁移文件** (`prisma/migrations/20260320000000_init/migration.sql`)
   - 创建 `users` 表
   - 创建 `notes` 表
   - 创建 `chat_messages` 表
   - 创建 `games` 表
   - 创建 `rooms` 表
   - 创建 `players` 表
   - 配置所有外键关系

### 📋 部署步骤

在部署到生产环境前，执行以下命令：

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma 客户端
npm run prisma:generate

# 3. 执行数据库迁移（创建表）
npm run prisma:migrate

# 4. 构建项目
npm run build

# 5. 启动应用
npm start
```

### 🔍 重要检查项

- [ ] 确保 `.env` 中的 `DATABASE_URL` 指向正确的 PostgreSQL 数据库
- [ ] PostgreSQL 数据库已创建并可访问
- [ ] 数据库用户有权限创建表和索引
- [ ] 所有必要的环境变量已配置

### 📊 数据库表结构

迁移文件将创建以下表：

| 表名 | 用途 |
|-----|------|
| `users` | 用户信息和认证令牌 |
| `notes` | 用户笔记 |
| `chat_messages` | 聊天消息 |
| `games` | 游戏列表 |
| `rooms` | 游戏房间 |
| `players` | 玩家信息 |

### ⚠️ 注意事项

- 迁移文件采用 PostgreSQL 语法
- 确保 Prisma schema (`prisma/schema.prisma`) 与数据库配置一致
- 首次运行迁移可能需要 2-5 分钟，取决于网络延迟

# 家庭资产管理系统 (Family Ledger)

> 夫妻共同资产管理 Web 应用 — 收支记录 · 贷款管理 · 资产统计 · 数据导出

## 页面预览

| 页面 | 预览 |
|------|------|
| Dashboard | ![Dashboard](docs/screenshots/dashboard.png) |
| 支出管理 | ![Expense](docs/screenshots/expense.png) |
| 贷款管理 | ![Loans](docs/screenshots/loans.png) |
| 导出中心 | ![Export](docs/screenshots/export.png) |
| 登录页 | ![Login](docs/screenshots/login.png) |

## 功能

- 收入/支出管理（智能分析、环比、分类占比）
- 资产管理（现金、投资、固定资产）
- 贷款管理（公积金/商贷/组合贷，独立进度条）
- 等额本息/等额本金计算
- 提前还款模拟（选择公积金/商贷/按比例）
- 利率调整动态重算
- Dashboard 数据可视化
- 导出中心（Excel/PDF 报表）
- 金额隐私保护（一键隐藏）
- 移动端适配 + 深色模式
- 家庭成员邀请协作

## 技术栈

- **框架**: Next.js 16 (全栈)
- **语言**: TypeScript
- **样式**: TailwindCSS 4
- **数据库**: SQLite (better-sqlite3) + Drizzle ORM
- **图表**: Recharts
- **导出**: ExcelJS + jsPDF
- **鉴权**: JWT (jose)
- **状态**: Zustand

## 环境要求

| 工具 | 版本 |
|------|------|
| Node.js | >= 20.x |
| npm | >= 9.x |
| 操作系统 | Windows / macOS / Linux |

无需安装数据库，SQLite 内嵌在项目中。

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Kunlun-Donkey/family-ledger.git
cd family-ledger

# 安装依赖
npm install

# 初始化数据库（创建表）
npx tsx src/lib/db/migrate.ts

# 填充测试数据（可选）
npx tsx scripts/seed.ts

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 局域网访问（手机）

启动后终端会显示 Network 地址（如 `http://192.168.x.x:3000`），手机连接同一 WiFi 后直接访问该地址。

### 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| husband@example.com | 123456 | 家庭创建者 |
| wife@example.com | 123456 | 家庭成员 |

家庭邀请码: `ABC123`

## 环境变量

创建 `.env` 文件（已包含默认值）：

```env
DATABASE_URL="file:./data.db"
JWT_SECRET="your-secret-key-change-in-production"
```

生产环境务必修改 `JWT_SECRET` 为随机长字符串。

## 部署

### 方式一：PM2（推荐）

```bash
npm run build
pm2 start npm --name "family-ledger" -- start
pm2 save && pm2 startup
```

### 方式二：Docker

```bash
docker compose up -d --build
```

### Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name finance.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 项目文档

详细技术文档见 [TECH_DOC.md](TECH_DOC.md)

## License

MIT

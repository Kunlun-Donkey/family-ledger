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

## 快速开始

```bash
# 安装依赖
npm install

# 初始化数据库
npx tsx src/lib/db/migrate.ts

# 填充测试数据
npx tsx scripts/seed.ts

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| husband@example.com | 123456 | 家庭创建者 |
| wife@example.com | 123456 | 家庭成员 |

家庭邀请码: `ABC123`

## 部署

### PM2

```bash
npm run build
pm2 start npm --name "family-ledger" -- start
```

### Docker

```bash
docker compose up -d --build
```

## 项目文档

详细技术文档见 [TECH_DOC.md](TECH_DOC.md)

## License

MIT

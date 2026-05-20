# 家庭资产管理系统 - 技术文档

## 一、项目概述

### 1.1 项目定位
夫妻共同资产管理 Web 应用，支持收支记录、贷款管理、资产统计，面向家庭用户的轻量级财务 SaaS 系统。

### 1.2 核心功能
- 收入/支出记录与智能分析（环比、日均、分类占比）
- 资产管理（现金、投资、固定资产）
- 贷款管理（公积金/商贷/组合贷，独立进度条）
- 等额本息/等额本金计算
- 提前还款模拟与重算（支持选择还款目标：公积金/商贷/按比例）
- 利率调整动态重算
- Dashboard 数据可视化（收支趋势、支出饼图、贷款概览）
- 导出中心（支出/收入 Excel、贷款还款计划 PDF、年度报告 PDF）
- 家庭成员协作（邀请码机制）
- 金额隐私保护（一键隐藏所有金额）
- 个人/家庭信息在线编辑
- 页面背景自定义

---

## 二、技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js | 16.x | 全栈框架（SSR + API Routes） |
| 语言 | TypeScript | 6.x | 类型安全 |
| 样式 | TailwindCSS | 4.x | 原子化 CSS |
| 数据库 | SQLite (better-sqlite3) | - | 开发/生产数据存储 |
| ORM | Drizzle ORM | 0.45.x | 数据库操作 |
| 图表 | Recharts | 3.x | 数据可视化 |
| 状态管理 | Zustand | 5.x | 客户端状态 |
| 鉴权 | jose (JWT) | 6.x | Token 签发/验证 |
| 加密 | bcryptjs | 3.x | 密码哈希 |
| 图标 | lucide-react | - | SVG 图标库 |
| 主题 | next-themes | 0.4.x | 深色模式 |
| Excel | exceljs | - | Excel 文件生成 |
| PDF | jsPDF + jspdf-autotable | - | PDF 报表生成 |
| 文件保存 | file-saver | - | 客户端文件下载 |

### 2.2 架构模式

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  React Client Components + Zustand Store     │
├─────────────────────────────────────────────┤
│              Next.js App Router               │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Pages (SSR) │  │  API Routes (REST)   │  │
│  └─────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────┤
│           Business Logic Layer               │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │ Auth (JWT)    │  │ Loan Calculator    │  │
│  └──────────────┘  └────────────────────┘  │
├─────────────────────────────────────────────┤
│              Data Layer                       │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │ Drizzle ORM  │  │ SQLite (WAL mode)  │  │
│  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 三、目录结构

```
family-finance/
├── prisma/                    # (已弃用，保留 schema 参考)
├── scripts/
│   └── seed.ts               # 数据库种子数据
├── public/
│   └── backgrounds/          # 背景图片资源
├── src/
│   ├── app/
│   │   ├── (auth)/           # 认证页面组
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/      # 主应用页面组
│   │   │   ├── layout.tsx    # 侧边栏+导航布局
│   │   │   ├── page.tsx      # Dashboard 首页
│   │   │   ├── income/       # 收入管理
│   │   │   ├── expense/      # 支出管理（含分析统计）
│   │   │   ├── assets/       # 资产管理
│   │   │   ├── loans/        # 贷款管理（含提前还款/利率调整）
│   │   │   ├── export/       # 导出中心（Excel/PDF）
│   │   │   └── settings/     # 设置（个人信息/家庭/背景）
│   │   ├── api/              # RESTful API
│   │   │   ├── auth/         # 认证相关
│   │   │   │   ├── login/    # 登录
│   │   │   │   ├── register/ # 注册
│   │   │   │   ├── logout/   # 登出
│   │   │   │   ├── me/       # 当前用户信息
│   │   │   │   ├── family/   # 家庭创建/加入
│   │   │   │   └── profile/  # 个人资料修改
│   │   │   ├── incomes/      # 收入 CRUD
│   │   │   ├── expenses/     # 支出 CRUD
│   │   │   ├── assets/       # 资产 CRUD
│   │   │   ├── loans/        # 贷款管理（CRUD + 提前还款 + 利率调整）
│   │   │   ├── dashboard/    # Dashboard 聚合数据
│   │   │   └── upload/       # 文件上传
│   │   ├── layout.tsx        # 根布局
│   │   └── globals.css       # 全局样式 + Design System
│   ├── components/
│   │   ├── ui/               # 基础 UI 组件
│   │   ├── charts/           # 图表组件
│   │   ├── theme-provider.tsx
│   │   └── page-background.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts      # Drizzle 数据库实例
│   │   │   ├── schema.ts     # 数据表定义
│   │   │   └── migrate.ts    # 数据库迁移脚本
│   │   ├── export/
│   │   │   ├── excel.ts      # Excel 导出（exceljs）
│   │   │   └── pdf.ts        # PDF 导出（jsPDF）
│   │   ├── auth.ts           # JWT 工具函数
│   │   ├── api-helpers.ts    # API 上下文提取
│   │   ├── loan-calculator.ts # 贷款计算引擎
│   │   └── utils.ts          # 通用工具函数
│   ├── hooks/
│   │   └── use-privacy.ts    # 金额隐私 Hook（全局显示/隐藏）
│   └── store/
│       ├── auth-store.ts     # 认证状态
│       └── background-store.ts # 背景设置状态
├── data.db                   # SQLite 数据库文件
├── .env                      # 环境变量
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 四、数据库设计

### 4.1 ER 关系图

```
User ──┐
       ├──> FamilyMember ──> Family
User ──┘                       │
                               ├──> Income
                               ├──> Expense
                               ├──> Asset
                               └──> Loan ──┬──> LoanSchedule
                                           └──> LoanEvent
```

### 4.2 数据表

#### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| email | TEXT UNIQUE | 邮箱 |
| password_hash | TEXT | bcrypt 哈希 |
| nickname | TEXT | 昵称 |
| created_at | TEXT | ISO 时间戳 |

#### families
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| name | TEXT | 家庭名称 |
| created_by | TEXT | 创建者 user_id |
| invite_code | TEXT UNIQUE | 6位邀请码 |
| created_at | TEXT | ISO 时间戳 |

#### family_members
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| family_id | TEXT FK | 关联 families |
| user_id | TEXT FK | 关联 users |
| role | TEXT | owner / member |

#### incomes
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| family_id | TEXT FK | 家庭 |
| user_id | TEXT FK | 录入人 |
| type | TEXT | salary/bonus/side_income/other |
| amount | REAL | 金额 |
| date | TEXT | YYYY-MM-DD |
| remark | TEXT | 备注 |
| created_at | TEXT | ISO 时间戳 |

#### expenses
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| family_id | TEXT FK | 家庭 |
| user_id | TEXT FK | 录入人 |
| category | TEXT | 分类 |
| amount | REAL | 金额 |
| date | TEXT | YYYY-MM-DD |
| pay_method | TEXT | alipay/wechat/card/cash |
| is_fixed | INTEGER | 是否固定支出 |
| remark | TEXT | 备注 |
| created_at | TEXT | ISO 时间戳 |

#### assets
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| family_id | TEXT FK | 家庭 |
| user_id | TEXT FK | 持有人 |
| type | TEXT | cash_bank/invest_fund/fixed_house 等 |
| name | TEXT | 资产名称 |
| value | REAL | 当前价值 |
| updated_at | TEXT | 更新时间 |
| created_at | TEXT | 创建时间 |

#### loans
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| family_id | TEXT FK | 家庭 |
| loan_type | TEXT | provident_fund/commercial/mixed |
| name | TEXT | 贷款名称 |
| provident_amount | REAL | 公积金本金 |
| commercial_amount | REAL | 商贷本金 |
| provident_rate | REAL | 公积金年利率 (%) |
| commercial_rate | REAL | 商贷年利率 (%) |
| years | INTEGER | 贷款年限 |
| start_date | TEXT | 还款开始日期 |
| repayment_type | TEXT | equal_payment/equal_principal |
| remain_principal | REAL | 当前剩余本金（总） |
| is_settled | INTEGER | 是否已结清 |
| created_at | TEXT | 创建时间 |

#### loan_schedules
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| loan_id | TEXT FK | 关联 loans |
| period | INTEGER | 期数 |
| date | TEXT | 还款日期 |
| payment | REAL | 月供 |
| principal | REAL | 本金部分 |
| interest | REAL | 利息部分 |
| remain_principal | REAL | 该期后剩余本金 |
| status | TEXT | paid/unpaid |
| loan_part | TEXT | provident/commercial/total |

#### loan_events
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | cuid |
| loan_id | TEXT FK | 关联 loans |
| type | TEXT | prepayment/rate_change/manual_adjust |
| date | TEXT | 事件日期 |
| amount | REAL | 提前还款金额 |
| new_rate | REAL | 新利率 |
| remark | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

---

## 五、API 接口文档

### 5.1 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户信息 |
| POST | /api/auth/family | 创建家庭 |
| PUT | /api/auth/family | 加入家庭（邀请码） |
| PATCH | /api/auth/profile | 修改昵称/家庭名称 |

### 5.2 收入接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/incomes?month=YYYY-MM | 获取收入列表 |
| POST | /api/incomes | 新增收入 |
| PUT | /api/incomes/:id | 编辑收入 |
| DELETE | /api/incomes/:id | 删除收入 |

### 5.3 支出接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/expenses?month=YYYY-MM | 获取支出列表 |
| POST | /api/expenses | 新增支出 |
| PUT | /api/expenses/:id | 编辑支出 |
| DELETE | /api/expenses/:id | 删除支出 |

### 5.4 资产接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/assets | 获取资产列表 |
| POST | /api/assets | 新增资产 |
| PUT | /api/assets/:id | 编辑资产 |
| DELETE | /api/assets/:id | 删除资产 |

### 5.5 贷款接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/loans | 获取贷款列表 |
| POST | /api/loans | 创建贷款（含生成还款计划） |
| GET | /api/loans/:id | 获取贷款详情（含还款计划） |
| PATCH | /api/loans/:id | 修改贷款基本信息 |
| PUT | /api/loans/:id | 提前还款/利率调整 |
| DELETE | /api/loans/:id | 删除贷款 |

#### PUT /api/loans/:id 请求体

**提前还款：**
```json
{
  "action": "prepayment",
  "amount": "100000",
  "date": "2026-05-20",
  "target": "commercial",      // provident | commercial | both
  "repayMethod": "equal_payment" // equal_payment | equal_principal
}
```

**利率调整：**
```json
{
  "action": "rate_change",
  "date": "2026-05-20",
  "newProvidentRate": "2.85",
  "newCommercialRate": "3.2"
}
```

### 5.6 Dashboard 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dashboard | 获取首页聚合数据 |

返回：
```json
{
  "summary": {
    "totalAssets": 3225000,
    "totalDebt": 1500000,
    "netAssets": 1725000,
    "monthIncome": 35000,
    "monthExpense": 13300,
    "monthBalance": 21700
  },
  "monthlyTrend": [...],
  "expenseByCategory": [...],
  "loans": [...]
}
```

### 5.7 文件上传接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/upload | 上传背景图片（FormData） |

---

## 六、贷款计算引擎

### 6.1 文件路径
`src/lib/loan-calculator.ts`

### 6.2 核心算法

#### 等额本息（Equal Payment）
```
月供 A = P × r × (1+r)^n / ((1+r)^n - 1)

P = 贷款本金
r = 月利率 (年利率/12/100)
n = 总期数 (年限×12)
```

#### 等额本金（Equal Principal）
```
每月本金 = P / n
每月利息 = 剩余本金 × r
月供 = 每月本金 + 每月利息（逐月递减）
```

### 6.3 动态重算逻辑

**提前还款流程：**
1. 根据 `target` 计算各部分减少金额
2. 删除所有 `status=unpaid` 的还款计划
3. 按新剩余本金 + 选定还款方式重新生成还款计划
4. 更新贷款表 `remain_principal` 和 `repayment_type`

**利率调整流程：**
1. 删除未还期数
2. 以新利率重新计算剩余期数的还款计划
3. 更新贷款表利率字段

---

## 七、认证系统

### 7.1 流程
1. 注册：bcrypt 加密密码 → 存入数据库 → 签发 JWT → 写入 httpOnly cookie
2. 登录：验证密码 → 签发 JWT → 写入 cookie
3. 鉴权：每个 API 从 cookie 读取 token → jose 验证 → 提取 userId
4. 数据隔离：所有业务 API 通过 `getApiContext()` 自动获取 userId + familyId

### 7.2 Token 配置
- 算法：HS256
- 有效期：7 天
- 存储：httpOnly cookie（防 XSS）
- 刷新：登录时重新签发

---

## 八、设计系统 (Design System)

### 8.1 配色

| 变量 | 值 | 用途 |
|------|------|------|
| --background | #F5F3EF | 页面背景（奶油灰） |
| --card | #FFFFFF | 卡片背景 |
| --primary | #6D8B74 | 品牌色（鼠尾草绿） |
| --success | #4F8A5B | 收入/正向指标 |
| --destructive | #D16D6A | 支出/负向指标 |
| --warning | #D9A441 | 警告/利息 |
| --info | #7C8DB5 | 信息/房贷 |
| --title | #1F2937 | 一级标题 |
| --subtitle | #6B7280 | 二级标题/说明文字 |
| --foreground | #374151 | 正文 |
| --border | #E5E7EB | 边框 |
| --divider | #F1F5F9 | 分割线 |

### 8.2 字体层级

| 层级 | 大小 | 粗细 | 用途 |
|------|------|------|------|
| 页面标题 | 32px | 700 | 页面主标题 |
| 模块标题 | 20px | 600 | 卡片/区域标题 |
| 数据数字 | 36px / 28px | 700 | 核心金额数据 |
| 正文 | 15px | 400 | 普通文本 |
| 小标签 | 13px | 400/500 | 标签/说明 |
| 微标签 | 12px / 11px | 400 | 次要信息 |

### 8.3 间距系统
仅使用：4 / 8 / 12 / 16 / 24 / 32 / 48 px

### 8.4 圆角系统
- 卡片：24px
- 按钮/输入框：14px
- 标签/小元素：10px / 8px
- 进度条：full (9999px)

### 8.5 阴影系统
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.03);
--shadow-md: 0 8px 24px rgba(0,0,0,0.04);
--shadow-lg: 0 20px 40px rgba(0,0,0,0.06);
```

### 8.6 动画
统一过渡：`all 0.25s cubic-bezier(0.4, 0, 0.2, 1)`

---

## 九、状态管理

### 9.1 Zustand Stores

| Store | 文件 | 用途 |
|-------|------|------|
| useAuthStore | store/auth-store.ts | 用户/家庭信息 |
| useBackgroundStore | store/background-store.ts | 页面背景设置 |
| usePrivacy | hooks/use-privacy.ts | 金额隐藏状态 |

### 9.2 数据流
- 页面级数据：组件内 `useState` + `fetch`
- 全局状态：Zustand（无 Provider，直接 import 使用）
- 持久化：localStorage（背景设置）

---

## 十、部署

### 10.1 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| DATABASE_URL | SQLite 数据库路径 | file:./data.db |
| JWT_SECRET | JWT 签名密钥 | 随机 64 字符串 |

### 10.2 本地开发

```bash
cd family-finance
npm install
npx tsx src/lib/db/migrate.ts  # 创建表
npx tsx scripts/seed.ts         # 填充测试数据
npm run dev                     # http://localhost:3000
```

### 10.3 生产部署 (PM2)

```bash
npm run build
pm2 start npm --name "family-finance" -- start
```

### 10.4 Docker 部署

```bash
docker compose up -d --build
```

docker-compose.yml 包含：
- Next.js 应用（standalone 模式）
- PostgreSQL（可选，需修改 schema provider）

### 10.5 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name finance.example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 十一、安全

| 措施 | 实现 |
|------|------|
| 密码加密 | bcrypt (cost=10) |
| Token | JWT httpOnly cookie |
| 数据隔离 | 所有查询强制 familyId 过滤 |
| XSS 防护 | httpOnly cookie + React 自动转义 |
| CSRF | SameSite=Lax cookie |
| 输入验证 | 服务端类型检查 + parseFloat/parseInt |

---

## 十二、测试数据

种子脚本 (`scripts/seed.ts`) 创建：

| 账号 | 密码 | 角色 |
|------|------|------|
| husband@example.com | 123456 | 家庭创建者 |
| wife@example.com | 123456 | 家庭成员 |

家庭邀请码：`ABC123`

包含：
- 2 个月的收入数据（工资+奖金）
- 2 个月的支出数据（房贷/餐饮/购物/交通/水电）
- 6 项资产（银行卡/支付宝/微信/基金/房产）
- 1 笔组合贷（公积金 50 万 + 商贷 100 万，30 年）

---

## 十三、后续扩展方向

- [ ] 预算管理（按分类设月度上限，超支预警）
- [ ] 固定收支自动记录（每月自动生成）
- [ ] 理财产品管理（基金/股票收益率）
- [ ] AI 消费分析与预算建议
- [ ] 微信/支付宝账单 CSV 导入
- [ ] 多贷款独立年限管理
- [ ] 还款日提醒通知
- [ ] 资产净值时间线（月度快照）
- [ ] 年度报表页面（在线查看）
- [ ] 多家庭/多账本支持
- [ ] PWA 离线支持
- [x] ~~数据导出 (Excel/PDF)~~ ✅ 已实现

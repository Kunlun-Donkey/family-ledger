import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: text('nickname').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export const families = sqliteTable('families', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  createdBy: text('created_by').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export const familyMembers = sqliteTable('family_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // owner | member
})

export const incomes = sqliteTable('incomes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // salary | bonus | side_income | other
  amount: real('amount').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  remark: text('remark').default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  payMethod: text('pay_method').default('alipay'),
  isFixed: integer('is_fixed', { mode: 'boolean' }).default(false),
  remark: text('remark').default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  name: text('name').notNull(),
  value: real('value').notNull(),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export const loans = sqliteTable('loans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  loanType: text('loan_type').notNull(), // provident_fund | commercial | mixed
  name: text('name').notNull(),
  providentAmount: real('provident_amount').default(0),
  commercialAmount: real('commercial_amount').default(0),
  providentRate: real('provident_rate').default(0),
  commercialRate: real('commercial_rate').default(0),
  years: integer('years').notNull(),
  startDate: text('start_date').notNull(),
  repaymentType: text('repayment_type').notNull(), // equal_payment | equal_principal
  remainPrincipal: real('remain_principal').notNull(),
  isSettled: integer('is_settled', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

export const loanSchedules = sqliteTable('loan_schedules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loanId: text('loan_id').notNull().references(() => loans.id, { onDelete: 'cascade' }),
  period: integer('period').notNull(),
  date: text('date').notNull(),
  payment: real('payment').notNull(),
  principal: real('principal').notNull(),
  interest: real('interest').notNull(),
  remainPrincipal: real('remain_principal').notNull(),
  status: text('status').default('unpaid'), // paid | unpaid
  loanPart: text('loan_part').default('total'), // provident | commercial | total
})

export const loanEvents = sqliteTable('loan_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loanId: text('loan_id').notNull().references(() => loans.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // prepayment | rate_change | manual_adjust
  date: text('date').notNull(),
  amount: real('amount').default(0),
  newRate: real('new_rate').default(0),
  remark: text('remark').default(''),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
})

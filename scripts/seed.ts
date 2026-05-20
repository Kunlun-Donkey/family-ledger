import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { hash } from 'bcryptjs'
import * as schema from '../src/lib/db/schema'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data.db')
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
const db = drizzle(sqlite, { schema })

async function main() {
  const password = await hash('123456', 10)

  const husbandId = crypto.randomUUID()
  const wifeId = crypto.randomUUID()
  const familyId = crypto.randomUUID()

  // Create users
  db.insert(schema.users).values([
    { id: husbandId, email: 'husband@example.com', passwordHash: password, nickname: '老公' },
    { id: wifeId, email: 'wife@example.com', passwordHash: password, nickname: '老婆' },
  ]).run()

  // Create family
  db.insert(schema.families).values({
    id: familyId, name: '温馨小家', createdBy: husbandId, inviteCode: 'ABC123',
  }).run()

  db.insert(schema.familyMembers).values([
    { id: crypto.randomUUID(), familyId, userId: husbandId, role: 'owner' },
    { id: crypto.randomUUID(), familyId, userId: wifeId, role: 'member' },
  ]).run()

  // Incomes
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  db.insert(schema.incomes).values([
    { id: crypto.randomUUID(), familyId, userId: husbandId, type: 'salary', amount: 20000, date: `${thisMonth}-10`, remark: '月薪' },
    { id: crypto.randomUUID(), familyId, userId: wifeId, type: 'salary', amount: 15000, date: `${thisMonth}-10`, remark: '月薪' },
    { id: crypto.randomUUID(), familyId, userId: husbandId, type: 'salary', amount: 20000, date: `${lastMonth}-10`, remark: '月薪' },
    { id: crypto.randomUUID(), familyId, userId: wifeId, type: 'salary', amount: 15000, date: `${lastMonth}-10`, remark: '月薪' },
    { id: crypto.randomUUID(), familyId, userId: husbandId, type: 'bonus', amount: 5000, date: `${lastMonth}-25`, remark: '项目奖金' },
  ]).run()

  // Expenses
  db.insert(schema.expenses).values([
    { id: crypto.randomUUID(), familyId, userId: husbandId, category: 'mortgage', amount: 8000, date: `${thisMonth}-01`, payMethod: 'card', isFixed: true, remark: '房贷月供' },
    { id: crypto.randomUUID(), familyId, userId: wifeId, category: 'food', amount: 3000, date: `${thisMonth}-15`, payMethod: 'alipay', remark: '餐饮开支' },
    { id: crypto.randomUUID(), familyId, userId: wifeId, category: 'shopping', amount: 1500, date: `${thisMonth}-12`, payMethod: 'wechat', remark: '日用品' },
    { id: crypto.randomUUID(), familyId, userId: husbandId, category: 'transport', amount: 500, date: `${thisMonth}-05`, payMethod: 'alipay', remark: '加油' },
    { id: crypto.randomUUID(), familyId, userId: husbandId, category: 'utilities', amount: 300, date: `${thisMonth}-03`, payMethod: 'alipay', remark: '水电燃气' },
    { id: crypto.randomUUID(), familyId, userId: husbandId, category: 'mortgage', amount: 8000, date: `${lastMonth}-01`, payMethod: 'card', isFixed: true, remark: '房贷月供' },
    { id: crypto.randomUUID(), familyId, userId: wifeId, category: 'food', amount: 2800, date: `${lastMonth}-15`, payMethod: 'alipay', remark: '餐饮开支' },
    { id: crypto.randomUUID(), familyId, userId: wifeId, category: 'childcare', amount: 2000, date: `${lastMonth}-20`, payMethod: 'wechat', remark: '早教课' },
  ]).run()

  // Assets
  db.insert(schema.assets).values([
    { id: crypto.randomUUID(), familyId, userId: husbandId, type: 'cash_bank', name: '招商银行工资卡', value: 50000 },
    { id: crypto.randomUUID(), familyId, userId: wifeId, type: 'cash_bank', name: '建设银行储蓄卡', value: 80000 },
    { id: crypto.randomUUID(), familyId, userId: husbandId, type: 'cash_alipay', name: '支付宝余额宝', value: 30000 },
    { id: crypto.randomUUID(), familyId, userId: wifeId, type: 'cash_wechat', name: '微信零钱通', value: 15000 },
    { id: crypto.randomUUID(), familyId, userId: husbandId, type: 'invest_fund', name: '沪深300指数基金', value: 50000 },
    { id: crypto.randomUUID(), familyId, userId: husbandId, type: 'fixed_house', name: '自住房产', value: 3000000 },
  ]).run()

  // Loan
  db.insert(schema.loans).values({
    id: crypto.randomUUID(), familyId, loanType: 'mixed', name: '首套房贷',
    providentAmount: 500000, commercialAmount: 1000000,
    providentRate: 3.1, commercialRate: 3.45,
    years: 30, startDate: '2024-01-01', repaymentType: 'equal_payment',
    remainPrincipal: 1500000,
  }).run()

  console.log('Seed completed!')
  console.log('Test accounts:')
  console.log('  husband@example.com / 123456')
  console.log('  wife@example.com / 123456')
  console.log('  Family invite code: ABC123')
}

main().catch(console.error).finally(() => sqlite.close())

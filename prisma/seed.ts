import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create users
  const password = await hash('123456', 10)

  const husband = await prisma.user.upsert({
    where: { email: 'husband@example.com' },
    update: {},
    create: {
      email: 'husband@example.com',
      passwordHash: password,
      nickname: '老公',
    },
  })

  const wife = await prisma.user.upsert({
    where: { email: 'wife@example.com' },
    update: {},
    create: {
      email: 'wife@example.com',
      passwordHash: password,
      nickname: '老婆',
    },
  })

  // Create family
  const family = await prisma.family.create({
    data: {
      name: '温馨小家',
      createdBy: husband.id,
      inviteCode: 'ABC123',
      members: {
        create: [
          { userId: husband.id, role: 'owner' },
          { userId: wife.id, role: 'member' },
        ],
      },
    },
  })

  // Add incomes
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  await prisma.income.createMany({
    data: [
      { familyId: family.id, userId: husband.id, type: 'salary', amount: 20000, date: `${thisMonth}-10`, remark: '月薪' },
      { familyId: family.id, userId: wife.id, type: 'salary', amount: 15000, date: `${thisMonth}-10`, remark: '月薪' },
      { familyId: family.id, userId: husband.id, type: 'salary', amount: 20000, date: `${lastMonth}-10`, remark: '月薪' },
      { familyId: family.id, userId: wife.id, type: 'salary', amount: 15000, date: `${lastMonth}-10`, remark: '月薪' },
      { familyId: family.id, userId: husband.id, type: 'bonus', amount: 5000, date: `${lastMonth}-25`, remark: '项目奖金' },
    ],
  })

  // Add expenses
  await prisma.expense.createMany({
    data: [
      { familyId: family.id, userId: husband.id, category: 'mortgage', amount: 8000, date: `${thisMonth}-01`, payMethod: 'card', isFixed: true, remark: '房贷月供' },
      { familyId: family.id, userId: wife.id, category: 'food', amount: 3000, date: `${thisMonth}-15`, payMethod: 'alipay', remark: '餐饮开支' },
      { familyId: family.id, userId: wife.id, category: 'shopping', amount: 1500, date: `${thisMonth}-12`, payMethod: 'wechat', remark: '日用品' },
      { familyId: family.id, userId: husband.id, category: 'transport', amount: 500, date: `${thisMonth}-05`, payMethod: 'alipay', remark: '加油' },
      { familyId: family.id, userId: husband.id, category: 'utilities', amount: 300, date: `${thisMonth}-03`, payMethod: 'alipay', remark: '水电燃气' },
      { familyId: family.id, userId: husband.id, category: 'mortgage', amount: 8000, date: `${lastMonth}-01`, payMethod: 'card', isFixed: true, remark: '房贷月供' },
      { familyId: family.id, userId: wife.id, category: 'food', amount: 2800, date: `${lastMonth}-15`, payMethod: 'alipay', remark: '餐饮开支' },
      { familyId: family.id, userId: wife.id, category: 'childcare', amount: 2000, date: `${lastMonth}-20`, payMethod: 'wechat', remark: '早教课' },
    ],
  })

  // Add assets
  await prisma.asset.createMany({
    data: [
      { familyId: family.id, userId: husband.id, type: 'cash_bank', name: '招商银行工资卡', value: 50000 },
      { familyId: family.id, userId: wife.id, type: 'cash_bank', name: '建设银行储蓄卡', value: 80000 },
      { familyId: family.id, userId: husband.id, type: 'cash_alipay', name: '支付宝余额宝', value: 30000 },
      { familyId: family.id, userId: wife.id, type: 'cash_wechat', name: '微信零钱通', value: 15000 },
      { familyId: family.id, userId: husband.id, type: 'invest_fund', name: '沪深300指数基金', value: 50000 },
      { familyId: family.id, userId: husband.id, type: 'fixed_house', name: '自住房产', value: 3000000 },
    ],
  })

  // Create a mixed loan (mortgage)
  const loan = await prisma.loan.create({
    data: {
      familyId: family.id,
      loanType: 'mixed',
      name: '首套房贷',
      providentAmount: 500000,
      commercialAmount: 1000000,
      providentRate: 3.1,
      commercialRate: 3.45,
      years: 30,
      startDate: '2024-01-01',
      repaymentType: 'equal_payment',
      remainPrincipal: 1500000,
    },
  })

  console.log('Seed completed!')
  console.log(`Test accounts:`)
  console.log(`  husband@example.com / 123456`)
  console.log(`  wife@example.com / 123456`)
  console.log(`  Family invite code: ABC123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

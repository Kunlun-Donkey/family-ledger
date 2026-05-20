import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { eq, and, like } from 'drizzle-orm'

export async function GET() {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Current month income & expense
  const monthIncomes = db.select().from(schema.incomes)
    .where(and(eq(schema.incomes.familyId, ctx.familyId), like(schema.incomes.date, `${currentMonth}%`)))
    .all()
  const monthExpenses = db.select().from(schema.expenses)
    .where(and(eq(schema.expenses.familyId, ctx.familyId), like(schema.expenses.date, `${currentMonth}%`)))
    .all()

  const monthIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0)
  const monthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const monthBalance = monthIncome - monthExpense

  // Total assets
  const allAssets = db.select().from(schema.assets)
    .where(eq(schema.assets.familyId, ctx.familyId)).all()
  const totalAssets = allAssets.reduce((sum, a) => sum + a.value, 0)

  // Total debt
  const allLoans = db.select().from(schema.loans)
    .where(and(eq(schema.loans.familyId, ctx.familyId), eq(schema.loans.isSettled, false)))
    .all()
  const totalDebt = allLoans.reduce((sum, l) => sum + l.remainPrincipal, 0)
  const netAssets = totalAssets - totalDebt

  // Monthly trend (last 6 months)
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const incomes = db.select().from(schema.incomes)
      .where(and(eq(schema.incomes.familyId, ctx.familyId), like(schema.incomes.date, `${monthStr}%`)))
      .all()
    const expenses = db.select().from(schema.expenses)
      .where(and(eq(schema.expenses.familyId, ctx.familyId), like(schema.expenses.date, `${monthStr}%`)))
      .all()

    const inc = incomes.reduce((s, i) => s + i.amount, 0)
    const exp = expenses.reduce((s, e) => s + e.amount, 0)

    monthlyTrend.push({
      month: monthStr,
      income: Math.round(inc * 100) / 100,
      expense: Math.round(exp * 100) / 100,
      balance: Math.round((inc - exp) * 100) / 100,
    })
  }

  // Expense by category this month
  const categoryMap: Record<string, number> = {}
  monthExpenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount
  })
  const expenseByCategory = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
  }))

  return NextResponse.json({
    summary: {
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalDebt: Math.round(totalDebt * 100) / 100,
      netAssets: Math.round(netAssets * 100) / 100,
      monthIncome: Math.round(monthIncome * 100) / 100,
      monthExpense: Math.round(monthExpense * 100) / 100,
      monthBalance: Math.round(monthBalance * 100) / 100,
    },
    monthlyTrend,
    expenseByCategory,
    loans: allLoans.map(l => ({
      id: l.id,
      name: l.name,
      remainPrincipal: l.remainPrincipal,
    })),
  })
}

import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { generateSchedule } from '@/lib/loan-calculator'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const loans = db.select().from(schema.loans)
    .where(eq(schema.loans.familyId, ctx.familyId))
    .orderBy(desc(schema.loans.createdAt))
    .all()

  return NextResponse.json({ loans })
}

export async function POST(req: Request) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const body = await req.json()
  const {
    loanType, name, providentAmount, commercialAmount,
    providentRate, commercialRate, years, startDate, repaymentType,
  } = body

  if (!loanType || !name || !years || !startDate || !repaymentType) {
    return NextResponse.json({ error: '请填写必填字段' }, { status: 400 })
  }

  const totalPrincipal = (parseFloat(providentAmount) || 0) + (parseFloat(commercialAmount) || 0)
  const loanId = crypto.randomUUID()

  db.insert(schema.loans).values({
    id: loanId,
    familyId: ctx.familyId,
    loanType,
    name,
    providentAmount: parseFloat(providentAmount) || 0,
    commercialAmount: parseFloat(commercialAmount) || 0,
    providentRate: parseFloat(providentRate) || 0,
    commercialRate: parseFloat(commercialRate) || 0,
    years: parseInt(years),
    startDate,
    repaymentType,
    remainPrincipal: totalPrincipal,
  }).run()

  // Generate schedules
  const totalMonths = parseInt(years) * 12

  if (loanType === 'mixed' || loanType === 'provident_fund') {
    const pAmt = parseFloat(providentAmount) || 0
    if (pAmt > 0) {
      const pSchedule = generateSchedule({
        principal: pAmt,
        annualRate: parseFloat(providentRate) || 0,
        totalMonths,
        repaymentType,
        startDate,
      })
      for (const item of pSchedule) {
        db.insert(schema.loanSchedules).values({
          id: crypto.randomUUID(),
          loanId,
          period: item.period,
          date: item.date,
          payment: item.payment,
          principal: item.principal,
          interest: item.interest,
          remainPrincipal: item.remainPrincipal,
          loanPart: 'provident',
        }).run()
      }
    }
  }

  if (loanType === 'mixed' || loanType === 'commercial') {
    const cAmt = parseFloat(commercialAmount) || 0
    if (cAmt > 0) {
      const cSchedule = generateSchedule({
        principal: cAmt,
        annualRate: parseFloat(commercialRate) || 0,
        totalMonths,
        repaymentType,
        startDate,
      })
      for (const item of cSchedule) {
        db.insert(schema.loanSchedules).values({
          id: crypto.randomUUID(),
          loanId,
          period: item.period,
          date: item.date,
          payment: item.payment,
          principal: item.principal,
          interest: item.interest,
          remainPrincipal: item.remainPrincipal,
          loanPart: 'commercial',
        }).run()
      }
    }
  }

  return NextResponse.json({ loan: { id: loanId } })
}

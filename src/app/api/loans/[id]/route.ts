import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { generateSchedule } from '@/lib/loan-calculator'
import { eq, and, asc, desc, sql } from 'drizzle-orm'

// Get loan detail with schedule
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const loan = db.select().from(schema.loans)
    .where(and(eq(schema.loans.id, id), eq(schema.loans.familyId, ctx.familyId)))
    .get()

  if (!loan) {
    return NextResponse.json({ error: '贷款不存在' }, { status: 404 })
  }

  const schedules = db.select().from(schema.loanSchedules)
    .where(eq(schema.loanSchedules.loanId, id))
    .orderBy(asc(schema.loanSchedules.loanPart), asc(schema.loanSchedules.period))
    .all()

  const events = db.select().from(schema.loanEvents)
    .where(eq(schema.loanEvents.loanId, id))
    .orderBy(desc(schema.loanEvents.createdAt))
    .all()

  return NextResponse.json({ loan: { ...loan, schedules, events } })
}

// Delete loan
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  // Cascading delete via foreign keys may not work in SQLite, so delete manually
  db.delete(schema.loanSchedules).where(eq(schema.loanSchedules.loanId, id)).run()
  db.delete(schema.loanEvents).where(eq(schema.loanEvents.loanId, id)).run()
  db.delete(schema.loans)
    .where(and(eq(schema.loans.id, id), eq(schema.loans.familyId, ctx.familyId)))
    .run()

  return NextResponse.json({ success: true })
}

// Update loan basic info
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const body = await req.json()
  const { name, startDate, repaymentType, providentAmount, commercialAmount, providentRate, commercialRate, years, remainPrincipal } = body

  const loan = db.select().from(schema.loans)
    .where(and(eq(schema.loans.id, id), eq(schema.loans.familyId, ctx.familyId)))
    .get()

  if (!loan) {
    return NextResponse.json({ error: '贷款不存在' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (startDate !== undefined) updates.startDate = startDate
  if (repaymentType !== undefined) updates.repaymentType = repaymentType
  if (providentAmount !== undefined) updates.providentAmount = parseFloat(providentAmount)
  if (commercialAmount !== undefined) updates.commercialAmount = parseFloat(commercialAmount)
  if (providentRate !== undefined) updates.providentRate = parseFloat(providentRate)
  if (commercialRate !== undefined) updates.commercialRate = parseFloat(commercialRate)
  if (years !== undefined) updates.years = parseInt(years)
  if (remainPrincipal !== undefined) updates.remainPrincipal = parseFloat(remainPrincipal)

  if (Object.keys(updates).length > 0) {
    db.update(schema.loans).set(updates).where(eq(schema.loans.id, id)).run()
  }

  return NextResponse.json({ success: true })
}

// Recalculate / prepayment / rate change
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const body = await req.json()
  const { action } = body

  const loan = db.select().from(schema.loans)
    .where(and(eq(schema.loans.id, id), eq(schema.loans.familyId, ctx.familyId)))
    .get()

  if (!loan) {
    return NextResponse.json({ error: '贷款不存在' }, { status: 404 })
  }

  if (action === 'prepayment') {
    const { amount, date, target, repayMethod } = body // target: 'provident' | 'commercial' | 'both'
    const useRepaymentType = (repayMethod || loan.repaymentType) as 'equal_payment' | 'equal_principal'
    const prepayAmount = parseFloat(amount)
    const newRemain = loan.remainPrincipal - prepayAmount

    if (newRemain <= 0) {
      db.update(schema.loans).set({ remainPrincipal: 0, isSettled: true }).where(eq(schema.loans.id, id)).run()
      db.delete(schema.loanSchedules)
        .where(and(eq(schema.loanSchedules.loanId, id), eq(schema.loanSchedules.status, 'unpaid')))
        .run()
      db.insert(schema.loanEvents).values({
        id: crypto.randomUUID(), loanId: id, type: 'prepayment', date, amount: prepayAmount, remark: '提前结清',
      }).run()
      return NextResponse.json({ success: true, settled: true })
    }

    db.insert(schema.loanEvents).values({
      id: crypto.randomUUID(), loanId: id, type: 'prepayment', date, amount: prepayAmount,
      remark: target === 'provident' ? '还公积金' : target === 'commercial' ? '还商贷' : '按比例分配',
    }).run()

    db.delete(schema.loanSchedules)
      .where(and(eq(schema.loanSchedules.loanId, id), eq(schema.loanSchedules.status, 'unpaid')))
      .run()

    const paidResult = db.select({ count: sql<number>`count(*)` }).from(schema.loanSchedules)
      .where(and(eq(schema.loanSchedules.loanId, id), eq(schema.loanSchedules.status, 'paid')))
      .get()
    const paidCount = paidResult?.count || 0

    const totalMonths = loan.years * 12
    const remainMonths = totalMonths - paidCount
    const totalAmount = (loan.providentAmount || 0) + (loan.commercialAmount || 0)
    const providentRatio = totalAmount > 0 ? (loan.providentAmount || 0) / totalAmount : 0

    // Calculate how much goes to each part based on target
    const currentProvidentRemain = loan.remainPrincipal * providentRatio
    const currentCommercialRemain = loan.remainPrincipal * (1 - providentRatio)

    let providentReduction = 0
    let commercialReduction = 0
    if (target === 'provident') {
      providentReduction = Math.min(prepayAmount, currentProvidentRemain)
      commercialReduction = 0
    } else if (target === 'commercial') {
      providentReduction = 0
      commercialReduction = Math.min(prepayAmount, currentCommercialRemain)
    } else {
      providentReduction = prepayAmount * providentRatio
      commercialReduction = prepayAmount * (1 - providentRatio)
    }

    const newProvidentRemain = Math.max(0, currentProvidentRemain - providentReduction)
    const newCommercialRemain = Math.max(0, currentCommercialRemain - commercialReduction)

    if ((loan.providentAmount || 0) > 0 && newProvidentRemain > 0) {
      const pSchedule = generateSchedule({
        principal: newProvidentRemain,
        annualRate: loan.providentRate || 0,
        totalMonths: remainMonths,
        repaymentType: useRepaymentType,
        startDate: date,
      })
      for (const item of pSchedule) {
        db.insert(schema.loanSchedules).values({
          id: crypto.randomUUID(), loanId: id, period: paidCount + item.period,
          date: item.date, payment: item.payment, principal: item.principal,
          interest: item.interest, remainPrincipal: item.remainPrincipal, loanPart: 'provident',
        }).run()
      }
    }

    if ((loan.commercialAmount || 0) > 0 && newCommercialRemain > 0) {
      const cSchedule = generateSchedule({
        principal: newCommercialRemain,
        annualRate: loan.commercialRate || 0,
        totalMonths: remainMonths,
        repaymentType: useRepaymentType,
        startDate: date,
      })
      for (const item of cSchedule) {
        db.insert(schema.loanSchedules).values({
          id: crypto.randomUUID(), loanId: id, period: paidCount + item.period,
          date: item.date, payment: item.payment, principal: item.principal,
          interest: item.interest, remainPrincipal: item.remainPrincipal, loanPart: 'commercial',
        }).run()
      }
    }

    db.update(schema.loans).set({ remainPrincipal: newRemain, repaymentType: useRepaymentType }).where(eq(schema.loans.id, id)).run()
    return NextResponse.json({ success: true })
  }

  if (action === 'rate_change') {
    const { newProvidentRate, newCommercialRate, date } = body

    db.insert(schema.loanEvents).values({
      id: crypto.randomUUID(), loanId: id, type: 'rate_change', date,
      newRate: parseFloat(newCommercialRate || newProvidentRate || '0'),
      remark: `公积金: ${newProvidentRate || loan.providentRate}%, 商贷: ${newCommercialRate || loan.commercialRate}%`,
    }).run()

    db.delete(schema.loanSchedules)
      .where(and(eq(schema.loanSchedules.loanId, id), eq(schema.loanSchedules.status, 'unpaid')))
      .run()

    const paidResult = db.select({ count: sql<number>`count(*)` }).from(schema.loanSchedules)
      .where(and(eq(schema.loanSchedules.loanId, id), eq(schema.loanSchedules.status, 'paid')))
      .get()
    const paidCount = paidResult?.count || 0

    const totalMonths = loan.years * 12
    const remainMonths = totalMonths - paidCount
    const totalAmount = (loan.providentAmount || 0) + (loan.commercialAmount || 0)
    const providentRatio = totalAmount > 0 ? (loan.providentAmount || 0) / totalAmount : 0

    const updatedProvidentRate = parseFloat(newProvidentRate) || loan.providentRate || 0
    const updatedCommercialRate = parseFloat(newCommercialRate) || loan.commercialRate || 0

    if ((loan.providentAmount || 0) > 0) {
      const pRemain = loan.remainPrincipal * providentRatio
      const pSchedule = generateSchedule({
        principal: pRemain, annualRate: updatedProvidentRate, totalMonths: remainMonths,
        repaymentType: loan.repaymentType as 'equal_payment' | 'equal_principal', startDate: date,
      })
      for (const item of pSchedule) {
        db.insert(schema.loanSchedules).values({
          id: crypto.randomUUID(), loanId: id, period: paidCount + item.period,
          date: item.date, payment: item.payment, principal: item.principal,
          interest: item.interest, remainPrincipal: item.remainPrincipal, loanPart: 'provident',
        }).run()
      }
    }

    if ((loan.commercialAmount || 0) > 0) {
      const cRemain = loan.remainPrincipal * (1 - providentRatio)
      const cSchedule = generateSchedule({
        principal: cRemain, annualRate: updatedCommercialRate, totalMonths: remainMonths,
        repaymentType: loan.repaymentType as 'equal_payment' | 'equal_principal', startDate: date,
      })
      for (const item of cSchedule) {
        db.insert(schema.loanSchedules).values({
          id: crypto.randomUUID(), loanId: id, period: paidCount + item.period,
          date: item.date, payment: item.payment, principal: item.principal,
          interest: item.interest, remainPrincipal: item.remainPrincipal, loanPart: 'commercial',
        }).run()
      }
    }

    db.update(schema.loans).set({
      providentRate: updatedProvidentRate, commercialRate: updatedCommercialRate,
    }).where(eq(schema.loans.id, id)).run()

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 })
}

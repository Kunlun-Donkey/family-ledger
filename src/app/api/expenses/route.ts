import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { eq, and, like, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const searchParams = req.nextUrl.searchParams
  const month = searchParams.get('month')
  const category = searchParams.get('category')
  const userId = searchParams.get('userId')

  const conditions = [eq(schema.expenses.familyId, ctx.familyId)]
  if (month) conditions.push(like(schema.expenses.date, `${month}%`))
  if (category) conditions.push(eq(schema.expenses.category, category))
  if (userId) conditions.push(eq(schema.expenses.userId, userId))

  const rows = db.select({
    id: schema.expenses.id,
    category: schema.expenses.category,
    amount: schema.expenses.amount,
    date: schema.expenses.date,
    payMethod: schema.expenses.payMethod,
    isFixed: schema.expenses.isFixed,
    remark: schema.expenses.remark,
    nickname: schema.users.nickname,
  })
    .from(schema.expenses)
    .leftJoin(schema.users, eq(schema.expenses.userId, schema.users.id))
    .where(and(...conditions))
    .orderBy(desc(schema.expenses.date))
    .all()

  const expenses = rows.map(r => ({
    id: r.id,
    category: r.category,
    amount: r.amount,
    date: r.date,
    payMethod: r.payMethod,
    isFixed: r.isFixed,
    remark: r.remark,
    user: { nickname: r.nickname },
  }))

  return NextResponse.json({ expenses })
}

export async function POST(req: Request) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const { category, amount, date, payMethod, isFixed, remark } = await req.json()

  if (!category || !amount || !date) {
    return NextResponse.json({ error: '请填写必填字段' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  db.insert(schema.expenses).values({
    id,
    familyId: ctx.familyId,
    userId: ctx.userId,
    category,
    amount: parseFloat(amount),
    date,
    payMethod: payMethod || 'alipay',
    isFixed: isFixed || false,
    remark: remark || '',
  }).run()

  return NextResponse.json({ expense: { id } })
}

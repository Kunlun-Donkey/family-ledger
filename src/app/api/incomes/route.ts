import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { eq, and, like, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const searchParams = req.nextUrl.searchParams
  const month = searchParams.get('month')
  const userId = searchParams.get('userId')

  const conditions = [eq(schema.incomes.familyId, ctx.familyId)]
  if (month) conditions.push(like(schema.incomes.date, `${month}%`))
  if (userId) conditions.push(eq(schema.incomes.userId, userId))

  const rows = db.select({
    id: schema.incomes.id,
    type: schema.incomes.type,
    amount: schema.incomes.amount,
    date: schema.incomes.date,
    remark: schema.incomes.remark,
    userId: schema.incomes.userId,
    nickname: schema.users.nickname,
  })
    .from(schema.incomes)
    .leftJoin(schema.users, eq(schema.incomes.userId, schema.users.id))
    .where(and(...conditions))
    .orderBy(desc(schema.incomes.date))
    .all()

  const incomes = rows.map(r => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    date: r.date,
    remark: r.remark,
    user: { nickname: r.nickname },
  }))

  return NextResponse.json({ incomes })
}

export async function POST(req: Request) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const { type, amount, date, remark } = await req.json()

  if (!type || !amount || !date) {
    return NextResponse.json({ error: '请填写必填字段' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  db.insert(schema.incomes).values({
    id,
    familyId: ctx.familyId,
    userId: ctx.userId,
    type,
    amount: parseFloat(amount),
    date,
    remark: remark || '',
  }).run()

  return NextResponse.json({ income: { id } })
}

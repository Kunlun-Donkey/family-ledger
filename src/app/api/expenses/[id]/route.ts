import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { eq, and } from 'drizzle-orm'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const { category, amount, date, payMethod, isFixed, remark } = await req.json()

  db.update(schema.expenses)
    .set({ category, amount: parseFloat(amount), date, payMethod, isFixed, remark: remark || '' })
    .where(and(eq(schema.expenses.id, id), eq(schema.expenses.familyId, ctx.familyId)))
    .run()

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  db.delete(schema.expenses)
    .where(and(eq(schema.expenses.id, id), eq(schema.expenses.familyId, ctx.familyId)))
    .run()

  return NextResponse.json({ success: true })
}

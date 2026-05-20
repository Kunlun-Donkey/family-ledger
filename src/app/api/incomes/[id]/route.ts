import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { eq, and } from 'drizzle-orm'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const { type, amount, date, remark } = await req.json()

  db.update(schema.incomes)
    .set({ type, amount: parseFloat(amount), date, remark: remark || '' })
    .where(and(eq(schema.incomes.id, id), eq(schema.incomes.familyId, ctx.familyId)))
    .run()

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  db.delete(schema.incomes)
    .where(and(eq(schema.incomes.id, id), eq(schema.incomes.familyId, ctx.familyId)))
    .run()

  return NextResponse.json({ success: true })
}

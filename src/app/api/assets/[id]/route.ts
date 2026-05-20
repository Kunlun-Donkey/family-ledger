import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { eq, and } from 'drizzle-orm'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const { type, name, value } = await req.json()

  db.update(schema.assets)
    .set({ type, name, value: parseFloat(value), updatedAt: new Date().toISOString() })
    .where(and(eq(schema.assets.id, id), eq(schema.assets.familyId, ctx.familyId)))
    .run()

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  db.delete(schema.assets)
    .where(and(eq(schema.assets.id, id), eq(schema.assets.familyId, ctx.familyId)))
    .run()

  return NextResponse.json({ success: true })
}

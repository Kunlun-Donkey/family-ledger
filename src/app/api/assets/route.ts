import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { getApiContext, isErrorResponse } from '@/lib/api-helpers'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const rows = db.select({
    id: schema.assets.id,
    type: schema.assets.type,
    name: schema.assets.name,
    value: schema.assets.value,
    nickname: schema.users.nickname,
  })
    .from(schema.assets)
    .leftJoin(schema.users, eq(schema.assets.userId, schema.users.id))
    .where(eq(schema.assets.familyId, ctx.familyId))
    .orderBy(desc(schema.assets.updatedAt))
    .all()

  const assets = rows.map(r => ({
    id: r.id,
    type: r.type,
    name: r.name,
    value: r.value,
    user: { nickname: r.nickname },
  }))

  return NextResponse.json({ assets })
}

export async function POST(req: Request) {
  const ctx = await getApiContext()
  if (isErrorResponse(ctx)) return ctx

  const { type, name, value } = await req.json()

  if (!type || !name || value === undefined) {
    return NextResponse.json({ error: '请填写必填字段' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  db.insert(schema.assets).values({
    id,
    familyId: ctx.familyId,
    userId: ctx.userId,
    type,
    name,
    value: parseFloat(value),
  }).run()

  return NextResponse.json({ asset: { id } })
}

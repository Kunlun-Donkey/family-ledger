import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Create family
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name) {
    return NextResponse.json({ error: '请填写家庭名称' }, { status: 400 })
  }

  const existing = db.select().from(schema.familyMembers)
    .where(eq(schema.familyMembers.userId, session.userId)).get()
  if (existing) {
    return NextResponse.json({ error: '您已加入一个家庭' }, { status: 400 })
  }

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  const familyId = crypto.randomUUID()

  db.insert(schema.families).values({
    id: familyId,
    name,
    createdBy: session.userId,
    inviteCode,
  }).run()

  db.insert(schema.familyMembers).values({
    id: crypto.randomUUID(),
    familyId,
    userId: session.userId,
    role: 'owner',
  }).run()

  const family = db.select().from(schema.families)
    .where(eq(schema.families.id, familyId)).get()

  return NextResponse.json({ family })
}

// Join family by invite code
export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { inviteCode } = await req.json()
  if (!inviteCode) {
    return NextResponse.json({ error: '请填写邀请码' }, { status: 400 })
  }

  const existing = db.select().from(schema.familyMembers)
    .where(eq(schema.familyMembers.userId, session.userId)).get()
  if (existing) {
    return NextResponse.json({ error: '您已加入一个家庭' }, { status: 400 })
  }

  const family = db.select().from(schema.families)
    .where(eq(schema.families.inviteCode, inviteCode.toUpperCase())).get()
  if (!family) {
    return NextResponse.json({ error: '邀请码无效' }, { status: 404 })
  }

  db.insert(schema.familyMembers).values({
    id: crypto.randomUUID(),
    familyId: family.id,
    userId: session.userId,
    role: 'member',
  }).run()

  return NextResponse.json({ family })
}

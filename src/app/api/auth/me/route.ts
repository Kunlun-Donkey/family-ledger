import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const user = db.select({
    id: schema.users.id,
    email: schema.users.email,
    nickname: schema.users.nickname,
  }).from(schema.users)
    .where(eq(schema.users.id, session.userId)).get()

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 401 })
  }

  // Get user's family
  const membership = db.select().from(schema.familyMembers)
    .where(eq(schema.familyMembers.userId, user.id)).get()

  let family = null
  if (membership) {
    family = db.select().from(schema.families)
      .where(eq(schema.families.id, membership.familyId)).get()
  }

  return NextResponse.json({
    user,
    family: family || null,
    role: membership?.role || null,
  })
}

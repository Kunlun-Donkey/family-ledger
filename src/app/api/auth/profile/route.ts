import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Update user profile
export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { nickname, familyName } = await req.json()

  // Update nickname
  if (nickname) {
    db.update(schema.users)
      .set({ nickname })
      .where(eq(schema.users.id, session.userId))
      .run()
  }

  // Update family name (only owner can do this)
  if (familyName) {
    const membership = db.select().from(schema.familyMembers)
      .where(eq(schema.familyMembers.userId, session.userId))
      .get()

    if (membership && membership.role === 'owner') {
      db.update(schema.families)
        .set({ name: familyName })
        .where(eq(schema.families.id, membership.familyId))
        .run()
    }
  }

  return NextResponse.json({ success: true })
}

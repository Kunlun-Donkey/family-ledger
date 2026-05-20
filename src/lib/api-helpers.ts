import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

export interface ApiContext {
  userId: string
  familyId: string
}

export async function getApiContext(): Promise<ApiContext | NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const membership = db.select().from(schema.familyMembers)
    .where(eq(schema.familyMembers.userId, session.userId))
    .get()

  if (!membership) {
    return NextResponse.json({ error: '请先创建或加入家庭' }, { status: 403 })
  }

  return { userId: session.userId, familyId: membership.familyId }
}

export function isErrorResponse(ctx: ApiContext | NextResponse): ctx is NextResponse {
  return ctx instanceof NextResponse
}

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db, schema } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const { email, password, nickname } = await req.json()

    if (!email || !password || !nickname) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 })
    }

    const existing = db.select().from(schema.users)
      .where(eq(schema.users.email, email)).get()
    if (existing) {
      return NextResponse.json({ error: '邮箱已被注册' }, { status: 400 })
    }

    const passwordHash = await hash(password, 10)
    const id = crypto.randomUUID()

    db.insert(schema.users).values({ id, email, passwordHash, nickname }).run()

    const token = await signToken({ userId: id, email })

    const response = NextResponse.json({
      user: { id, email, nickname },
    })
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}

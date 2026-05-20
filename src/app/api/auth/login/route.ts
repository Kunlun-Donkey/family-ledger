import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { db, schema } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 })
    }

    const user = db.select().from(schema.users)
      .where(eq(schema.users.email, email)).get()
    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    const valid = await compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    const token = await signToken({ userId: user.id, email: user.email })

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, nickname: user.nickname },
    })
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}

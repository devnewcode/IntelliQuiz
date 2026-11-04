import { NextResponse } from 'next/server'
import { authenticateUser, generateToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(username, password)

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const token = generateToken(user)

    const response = NextResponse.json({
      success: true,
      token,
      user
    })

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      ...AUTH_COOKIE_OPTIONS
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { createUser, generateToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { username, password, name, email, role, adminCode } = await request.json()

    if (!username || !password || !name || !email) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { message: 'Username must be at least 3 characters long' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    if (role === 'admin') {
      const correctCode = process.env.ADMIN_SECRET_CODE

      if (!correctCode) {
        return NextResponse.json(
          { message: 'Admin registration is currently disabled' },
          { status: 403 }
        )
      }

      if (!adminCode || adminCode !== correctCode) {
        return NextResponse.json(
          { message: 'Invalid admin access code' },
          { status: 403 }
        )
      }
    }

    const safeRole = role === 'admin' ? 'admin' : 'student'

    const user = await createUser({
      username,
      password,
      name,
      email,
      role: safeRole
    })

    const token = generateToken(user)

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
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
    console.error('Registration error:', error)

    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { message: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { createUser, generateToken } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { username, password, name, email, role } = await request.json()

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

    const user = await createUser({
      username,
      password,
      name,
      email,
      role: role || 'student'
    })

    const token = generateToken(user)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      token,
      user
    })

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
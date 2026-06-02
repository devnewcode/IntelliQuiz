import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Quiz from '../../../lib/models/Quiz'

export async function GET() {
  try {
    await dbConnect()

    const quizzes = await Quiz.find({ isActive: true, isPublic: true })
      .sort({ createdAt: -1 })

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Get public quizzes error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch public quizzes' },
      { status: 500 }
    )
  }
}

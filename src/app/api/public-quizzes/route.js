
import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Quiz from '../../../lib/models/Quiz'

export async function GET() {
  try {
    await dbConnect()

    const quizzes = await Quiz.find({ isActive: true, isPublic: true })
      .sort({ createdAt: -1 })

    const safeQuizzes = quizzes.map((quizDoc) => {
      const quiz = quizDoc.toObject()
      const { passcode, questions, ...rest } = quiz

      return {
        ...rest,
        hasPasscode: Boolean(passcode && passcode.trim() !== ''),
        questions: questions.map(({ correctAnswer, ...question }) => question),
      }
    })

    return NextResponse.json({ quizzes: safeQuizzes })
  } catch (error) {
    console.error('Get public quizzes error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch public quizzes' },
      { status: 500 }
    )
  }
}
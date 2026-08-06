
import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/mongodb'
import Quiz from '../../../../lib/models/Quiz'

export async function POST(request) {
  try {
    const { quizId, passcode } = await request.json()

    if (!quizId) {
      return NextResponse.json({ message: 'Quiz ID is required' }, { status: 400 })
    }

    await dbConnect()

    const quiz = await Quiz.findOne({ _id: quizId, isActive: true, isPublic: true })
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // No passcode set on this quiz -> always valid
    if (!quiz.passcode || quiz.passcode.trim() === '') {
      return NextResponse.json({ valid: true })
    }

    const valid = (passcode || '').trim() === quiz.passcode.trim()
    return NextResponse.json({ valid })
  } catch (error) {
    console.error('Verify passcode error:', error)
    return NextResponse.json({ message: 'Failed to verify passcode' }, { status: 500 })
  }
}
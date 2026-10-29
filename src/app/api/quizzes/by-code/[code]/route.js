import { NextResponse } from 'next/server'
import dbConnect from '../../../../../lib/mongodb'
import Quiz from '../../../../../lib/models/Quiz'
import { verifyToken } from '../../../../../lib/auth'

export async function GET(request, context) {
  try {
    await dbConnect()

    const params = await context.params
    const rawCode = params?.code

    if (!rawCode) {
      return NextResponse.json(
        { message: 'Quiz code is required' },
        { status: 400 }
      )
    }

    const code = rawCode.trim().toUpperCase()

    const quiz = await Quiz.findOne({ quizCode: code, isActive: true })
      .populate('createdBy', 'name username')

    if (!quiz) {
      return NextResponse.json(
        { message: `No active quiz found with code "${code}". Please verify the code and try again.` },
        { status: 404 }
      )
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const decoded = token ? verifyToken(token) : null

    const isAdmin = decoded?.role === 'admin' || decoded?.role === 'superadmin'

    const quizObj = quiz.toObject()

    if (!isAdmin) {
      const { passcode, questions, ...rest } = quizObj
      return NextResponse.json({
        success: true,
        quiz: {
          ...rest,
          hasPasscode: Boolean(passcode && passcode.trim() !== ''),
          questions: (questions || []).map(({ correctAnswer, ...q }) => q)
        }
      })
    }

    return NextResponse.json({
      success: true,
      quiz: quizObj
    })

  } catch (error) {
    console.error('Fetch quiz by code error:', error)
    return NextResponse.json(
      { message: 'Failed to find quiz by code' },
      { status: 500 }
    )
  }
}


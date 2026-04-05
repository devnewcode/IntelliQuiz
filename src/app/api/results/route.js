import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Result from '../../../lib/models/Result'
import { verifyToken } from '../../../lib/auth'
import Quiz from '@/lib/models/Quiz'
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    await dbConnect()

    let results
    if (decoded.role === 'superadmin') {
  // superadmin sees all results
  results = await Result.find({})
    .populate('quiz', 'title')
    .populate('user', 'name username email')
    .sort({ completedAt: -1 })
} else if (decoded.role === 'admin') {

  // admin sees only results from their own quizzes
  const adminQuizIds = await Quiz.find({ createdBy: decoded.id }).distinct('_id')
  results = await Result.find({ quiz: { $in: adminQuizIds } })
    .populate('quiz', 'title')
    .populate('user', 'name username email')
    .sort({ completedAt: -1 })
}
else {
  // here the student will see only their own results ──
  results = await Result.find({ user: decoded.id })
    .populate('quiz', 'title')
    .sort({ completedAt: -1 })
}

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { quizId, answers, score, totalQuestions, correctAnswers, timeTaken } = await request.json()

    const result = await Result.create({
      quiz: quizId,
      user: decoded.id,
      answers,
      score,
      totalQuestions,
      correctAnswers,
      timeTaken
    })

    const populatedResult = await Result.findById(result._id)
      .populate('quiz', 'title')
      .populate('user', 'name username')

    return NextResponse.json({
      success: true,
      message: 'Result saved successfully!',
      result: populatedResult
    })

  } catch (error) {
    console.error('Save result error:', error)
    return NextResponse.json(
      { message: 'Failed to save result' },
      { status: 500 }
    )
  }
}
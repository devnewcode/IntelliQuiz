import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Result from '../../../lib/models/Result'
import { verifyToken } from '../../../lib/auth'

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
    if (decoded.role === 'admin') {
      results = await Result.find({})
        .populate('quiz', 'title')
        .populate('user', 'name username email')
        .sort({ completedAt: -1 })
    } else {
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
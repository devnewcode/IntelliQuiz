import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Quiz from '../../../lib/models/Quiz'
import { verifyToken } from '../../../lib/auth'

export async function GET(request) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const decoded = token ? verifyToken(token) : null
    // superadmin sees all, admin sees only their own, student/no auth sees all active
    const filter = decoded?.role === 'superadmin'
    ? { isActive: true }
    : decoded?.role === 'admin'
    ? { isActive: true, createdBy: decoded.id }
    : { isActive: true }
    
    
    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch quizzes' },
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
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    await dbConnect()

    const { title, description, questions, category, difficulty, timeLimit, timerEnabled } = await request.json()

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json(
        { message: 'Title and questions are required' },
        { status: 400 }
      )
    }

    const quiz = await Quiz.create({
      title,
      description,
      questions,
      category,
      difficulty,
      timeLimit: timeLimit || 30,
      timerEnabled: timerEnabled !== false,
      createdBy: decoded.id
    })

    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('createdBy', 'name username')

    return NextResponse.json({
      success: true,
      message: 'Quiz created successfully!',
      quiz: populatedQuiz
    })

  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json(
      { message: 'Failed to create quiz' },
      { status: 500 }
    )
  }
}
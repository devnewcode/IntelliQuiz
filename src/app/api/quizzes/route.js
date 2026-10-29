import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Quiz from '../../../lib/models/Quiz'
import { verifyToken } from '../../../lib/auth'

function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(request) {
  try {
    await dbConnect()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const decoded = token ? verifyToken(token) : null

    const isAdmin = decoded?.role === 'admin' || decoded?.role === 'superadmin'

    let filter
    if (decoded?.role === 'superadmin') {
      filter = { isActive: true }
    } else if (decoded?.role === 'admin') {
      filter = { isActive: true, createdBy: decoded.id }
    } else {
      // Students and guests ONLY see public quizzes in the general feed.
      // Private quizzes are strictly accessed via Quiz Code!
      filter = { isActive: true, isPublic: true }
    }

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })

    // Security: Only admins receive correctAnswer and passcode.
    // Students and guests receive sanitized questions without answers.
    const safeQuizzes = isAdmin
      ? quizzes
      : quizzes.map((quizDoc) => {
          const quiz = quizDoc.toObject()
          const { passcode, questions, ...rest } = quiz
          return {
            ...rest,
            hasPasscode: Boolean(passcode && passcode.trim() !== ''),
            questions: (questions || []).map(({ correctAnswer, ...q }) => q),
          }
        })

    return NextResponse.json({ quizzes: safeQuizzes })
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

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    await dbConnect()

    const {
      title,
      description,
      questions,
      category,
      difficulty,
      timeLimit,
      timerEnabled,
      isPublic,
      quizCode,
      passcode
    } = await request.json()

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json(
        { message: 'Title and questions are required' },
        { status: 400 }
      )
    }

    // Generate or format unique quiz code
    let finalCode = (quizCode || '').trim().toUpperCase()
    if (!finalCode) {
      let codeAttempt = generateRandomCode()
      while (await Quiz.findOne({ quizCode: codeAttempt })) {
        codeAttempt = generateRandomCode()
      }
      finalCode = codeAttempt
    } else {
      const existing = await Quiz.findOne({ quizCode: finalCode })
      if (existing) {
        return NextResponse.json(
          { message: `Quiz code "${finalCode}" is already in use. Please choose a different code.` },
          { status: 409 }
        )
      }
    }

    const quiz = await Quiz.create({
      title,
      description,
      questions,
      category,
      difficulty,
      timeLimit: timeLimit || 30,
      timerEnabled: timerEnabled !== false,
      createdBy: decoded.id,
      isPublic: Boolean(isPublic),
      quizCode: finalCode,
      passcode: passcode || ''
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

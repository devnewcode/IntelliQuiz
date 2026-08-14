// FILE LOCATION: src/app/api/results/route.js
// (replaces your existing file — GET handler is UNCHANGED. POST now uses
// the shared, tested gradeQuiz() function instead of repeating the same
// logic inline.)

import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Result from '../../../lib/models/Result'
import Quiz from '@/lib/models/Quiz'
import { verifyToken } from '../../../lib/auth'
import { gradeQuiz } from '../../../lib/scoring'

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
      results = await Result.find({})
        .populate('quiz', 'title')
        .populate('user', 'name username email')
        .sort({ completedAt: -1 })
    } else if (decoded.role === 'admin') {
      const adminQuizIds = await Quiz.find({ createdBy: decoded.id }).distinct('_id')
      results = await Result.find({ quiz: { $in: adminQuizIds } })
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
    const token = authHeader?.split(' ')[1]
    const decoded = token ? verifyToken(token) : null

    const body = await request.json()
    const { quizId, answers, timeTaken, guestName, guestEmail } = body

    if (!decoded && (!guestName || !guestEmail)) {
      return NextResponse.json({ message: 'Login or provide name and email to submit' }, { status: 401 })
    }

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ message: 'Missing quiz or answers data' }, { status: 400 })
    }

    await dbConnect()

    // Fetch the REAL quiz (with correctAnswer) — this never leaves the server.
    const quiz = await Quiz.findOne({ _id: quizId, isActive: true })
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // All the actual grading logic now lives in one tested place: scoring.js
    const { score, correctCount, totalQuestions, review } = gradeQuiz(quiz.questions, answers)

    const resultDoc = await Result.create({
      quiz: quizId,
      user: decoded?.id || null,
      answers: review.map((r) => ({
        questionId: r.questionId,
        selectedOption: r.selectedOptionIndex,
        isCorrect: r.isCorrect,
      })),
      score,
      totalQuestions,
      correctAnswers: correctCount,
      timeTaken: timeTaken || 0,
      guestName: guestName || '',
      guestEmail: guestEmail || '',
    })

    return NextResponse.json({
      success: true,
      message: 'Result saved successfully!',
      result: {
        id: resultDoc._id,
        score,
        correctAnswers: correctCount,
        totalQuestions,
        timeTaken: timeTaken || 0,
        review,
      },
    })
  } catch (error) {
    console.error('Save result error:', error)
    return NextResponse.json(
      { message: 'Failed to save result' },
      { status: 500 }
    )
  }
}
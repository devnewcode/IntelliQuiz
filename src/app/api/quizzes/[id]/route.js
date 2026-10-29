import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/mongodb'
import Quiz from '../../../../lib/models/Quiz'
import { verifyToken } from '../../../../lib/auth'

export async function PUT(request, context) {
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

    const params = await context.params
    const quizId = params?.id

    const body = await request.json()
    const {
      title,
      description,
      category,
      difficulty,
      timeLimit,
      timerEnabled,
      isPublic,
      quizCode,
      passcode,
      questions
    } = body

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json(
        { message: 'Title and questions are required' },
        { status: 400 }
      )
    }

    const filter = decoded.role === 'superadmin'
      ? { _id: quizId }
      : { _id: quizId, createdBy: decoded.id }

    const updateFields = {
      title,
      description,
      category,
      difficulty,
      timeLimit: timeLimit || 30,
      timerEnabled: timerEnabled !== false,
      isPublic: Boolean(isPublic),
      passcode: passcode || '',
      questions
    }

    if (quizCode) {
      const formattedCode = quizCode.trim().toUpperCase()
      const existing = await Quiz.findOne({ quizCode: formattedCode, _id: { $ne: quizId } })
      if (existing) {
        return NextResponse.json(
          { message: `Quiz code "${formattedCode}" is already in use by another quiz.` },
          { status: 409 }
        )
      }
      updateFields.quizCode = formattedCode
    }

    const updatedQuiz = await Quiz.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name username')

    if (!updatedQuiz) {
      return NextResponse.json(
        { message: 'Quiz not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz updated successfully!',
      quiz: updatedQuiz
    })
  } catch (error) {
    console.error('Update quiz error:', error)
    return NextResponse.json(
      { message: 'Failed to update quiz' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, context) {
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

    const params = await context.params
    const quizId = params?.id
    
    // Find and delete the quiz
    const deletedQuiz = decoded.role === 'superadmin'
      ? await Quiz.findOneAndDelete({ _id: quizId })
      : await Quiz.findOneAndDelete({ _id: quizId, createdBy: decoded.id })

    if (!deletedQuiz) {
      return NextResponse.json(
        { message: 'Quiz not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully!'
    })

  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { message: 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}

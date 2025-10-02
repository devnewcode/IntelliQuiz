import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/mongodb'
import Quiz from '../../../../lib/models/Quiz'
import { verifyToken } from '../../../../lib/auth'

export async function DELETE(request, { params }) {
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

    const quizId = params.id
    
    // Find and delete the quiz
    const deletedQuiz = await Quiz.findOneAndDelete({ 
      _id: quizId,
      createdBy: decoded.id // Only allow deletion of own quizzes
    })

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
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  try {
    const { wrongQuestions } = await request.json()

    // wrongQuestions is an array of:
    // { questionId, question, options, correctAnswer (index), studentAnswer (index) }

    if (!wrongQuestions || wrongQuestions.length === 0) {
      return NextResponse.json({ message: 'No wrong questions provided' }, { status: 400 })
    }

    // Build a prompt listing each wrong question with the correct answer
    const questionLines = wrongQuestions.map((q, i) => {
      const correctText = q.options[q.correctAnswer]
      const studentText = q.options[q.studentAnswer] ?? 'Not answered'
      return `Q${i + 1}: ${q.question}
Student answered: "${studentText}"
Correct answer: "${correctText}"`
    }).join('\n\n')

    const fullPrompt = `A student got the following quiz questions wrong. 
For each question, write a simple 1-2 sentence explanation of why the correct answer is right.
Be clear, friendly, and educational. Do not repeat the question text.

${questionLines}

Return ONLY a valid JSON array, no markdown, no extra text.
Format:
[
  {
    "questionId": "the_question_id_here",
    "explanation": "Your explanation here."
  }
]

The questionId values must match exactly: ${wrongQuestions.map(q => `"${q.questionId}"`).join(', ')}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const result = await model.generateContent(fullPrompt)
    const text = result.response.text()

    // Clean response — remove markdown if Gemini adds it
    const cleaned = text.replace(/```json|```/g, '').trim()
    const explanations = JSON.parse(cleaned)

    if (!Array.isArray(explanations)) {
      return NextResponse.json({ message: 'Invalid response from AI' }, { status: 500 })
    }

    return NextResponse.json({ success: true, explanations })

  } catch (error) {
    console.error('Explain answers API error:', error)
    return NextResponse.json(
      { message: 'Failed to generate explanations. Please try again.' },
      { status: 500 }
    )
  }
}
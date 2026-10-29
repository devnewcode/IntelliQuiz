import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'

export async function POST(request) {
  let questionsToExplain = []
  try {
    const { wrongQuestions } = await request.json()

    if (!wrongQuestions || !Array.isArray(wrongQuestions) || wrongQuestions.length === 0) {
      return NextResponse.json({ message: 'No wrong questions provided' }, { status: 400 })
    }

    questionsToExplain = wrongQuestions.slice(0, 25)

    if (!process.env.GEMINI_API_KEY) {
      const fallback = questionsToExplain.map(q => ({
        questionId: q.questionId,
        explanation: `The correct answer is "${q.options?.[q.correctAnswer] || 'indicated above'}". Review this topic to strengthen your understanding.`
      }))
      return NextResponse.json({ success: true, explanations: fallback })
    }

    const questionLines = questionsToExplain.map((q, i) => {
      const correctText = q.options?.[q.correctAnswer] ?? 'Unknown'
      const studentText = (q.options && q.studentAnswer !== undefined && q.options[q.studentAnswer])
        ? q.options[q.studentAnswer]
        : 'Not answered'
      return `Q${i + 1}: ${q.question}
Student answered: "${studentText}"
Correct answer: "${correctText}"`
    }).join('\n\n')

    const fullPrompt = `A student got the following quiz questions wrong. 
For each question, write a concise, friendly 1-2 sentence explanation of why the correct answer is right and why it makes sense.
Do not repeat the entire question text.

${questionLines}

Return ONLY a valid JSON array, no markdown, no backticks.
Format:
[
  {
    "questionId": "the_question_id_here",
    "explanation": "Your explanation here."
  }
]

The questionId values must match exactly: ${questionsToExplain.map(q => `"${q.questionId}"`).join(', ')}`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })

    const result = await model.generateContent(fullPrompt)
    const text = result.response.text()

    const cleaned = text.replace(/```json|```/g, '').trim()
    let explanations
    try {
      explanations = JSON.parse(cleaned)
    } catch {
      explanations = questionsToExplain.map(q => ({
        questionId: q.questionId,
        explanation: `The correct answer is "${q.options?.[q.correctAnswer]}".`
      }))
    }

    if (!Array.isArray(explanations)) {
      explanations = questionsToExplain.map(q => ({
        questionId: q.questionId,
        explanation: `The correct answer is "${q.options?.[q.correctAnswer]}".`
      }))
    }

    return NextResponse.json({ success: true, explanations })

  } catch (error) {
    console.error('Explain answers API error:', error)
    const fallback = questionsToExplain.map(q => ({
      questionId: q.questionId,
      explanation: `The correct answer is "${q.options?.[q.correctAnswer] || 'indicated above'}".`
    }))
    return NextResponse.json({ success: true, explanations: fallback })
  }
}

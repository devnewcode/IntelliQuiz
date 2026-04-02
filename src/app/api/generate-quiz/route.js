import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  try {
    const { topic, difficulty, count, prompt } = await request.json()

    //previous generating code
    // Build the prompt — supports both modes (topic fields OR free text)
//     const finalPrompt = prompt ||
//       `Generate ${count} multiple choice quiz questions about "${topic}" with ${difficulty} difficulty.`

//     const fullPrompt = `${finalPrompt}

// Return ONLY a valid JSON array, no extra text, no markdown, no explanation.
// Format:
// [
//   {
//     "question": "Question text here?",
//     "options": ["Option A", "Option B", "Option C", "Option D"],
//     "correctAnswer": 0
//   }
// ]

// Rules:
// - correctAnswer is the index (0, 1, 2, or 3) of the correct option
// - Each question must have exactly 4 options
// - Questions should be clear and educational
// - Difficulty: ${difficulty || 'medium'}
// - Number of questions: ${count || 20}`
//previous generating code

const fullPrompt = prompt
  ? `${prompt}

IMPORTANT: Follow the exact number of questions mentioned in the prompt above.

Return ONLY a valid JSON array, no extra text, no markdown, no explanation.
Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Rules:
- correctAnswer is the index (0, 1, 2, or 3) of the correct option
- Each question must have exactly 4 options
- Questions should be clear and educational`

  : `Generate EXACTLY ${count} multiple choice quiz questions about "${topic}" with ${difficulty} difficulty.

IMPORTANT: You MUST return EXACTLY ${count} questions — no more, no less. Count them before responding.

Return ONLY a valid JSON array, no extra text, no markdown, no explanation.
Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Rules:
- correctAnswer is the index (0, 1, 2, or 3) of the correct option
- Each question must have exactly 4 options
- Questions should be clear and educational
- Difficulty: ${difficulty}`

    // const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const result = await model.generateContent(fullPrompt)
    const text = result.response.text()

    // Clean response — remove markdown if Gemini adds it
    const cleaned = text.replace(/```json|```/g, '').trim()
    const questions = JSON.parse(cleaned)

    // Validate structure
    if (!Array.isArray(questions)) {
      return NextResponse.json({ message: 'Invalid response from AI' }, { status: 500 })
    }

    return NextResponse.json({ success: true, questions })

  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { message: 'Failed to generate questions. Please try again.' },
      { status: 500 }
    )
  }
}
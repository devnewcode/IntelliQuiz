import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { retrieveRelevantChunks } from '../../../lib/rag/retrieve'
import SourceDocument from '../../../lib/models/SourceDocument'
import dbConnect from '../../../lib/mongodb'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const QuestionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 options'),
  correctAnswer: z.number().int().min(0).max(3),
})

const QuestionsArraySchema = z.array(QuestionSchema).min(1, 'At least one question is required')

const RATE_LIMIT_MAX_REQUESTS = 5
const RATE_LIMIT_WINDOW_MS = 60 * 1000

const requestLog = new Map()

function isRateLimited(ip) {
  const now = Date.now()
  const timestamps = requestLog.get(ip) || []

  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, recent)
    return true
  }

  recent.push(now)
  requestLog.set(ip, recent)
  return false
}

function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  return forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
}

// Parses Gemini's response and checks it against the question schema.
async function generateAndValidate(model, promptText) {
  const result = await model.generateContent(promptText)
  const rawText = result.response.text()
  const cleaned = rawText.replace(/```json|```/g, '').trim()

  let parsedJson
  try {
    parsedJson = JSON.parse(cleaned)
  } catch {
    return { success: false, error: 'not_json', rawText }
  }

  const validation = QuestionsArraySchema.safeParse(parsedJson)
  if (!validation.success) {
    return {
      success: false,
      error: 'schema_mismatch',
      issues: validation.error.issues,
      rawText,
    }
  }

  return { success: true, questions: validation.data }
}

export async function POST(request) {
  try {
    // Limit repeated requests from the same IP.
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    const { topic, difficulty, count, prompt, sourceDocumentId } = await request.json()

    let documentContext = ''
    let retrievedCount = 0
    let chunkCountForStats = 0

    // RAG: retrieve only the most relevant chunks from the selected document.
    if (sourceDocumentId) {
      if (!prompt || !prompt.trim()) {
        return NextResponse.json(
          { message: 'Please describe what questions you want from this document.' },
          { status: 400 }
        )
      }

      await dbConnect()
      const sourceDoc = await SourceDocument.findById(sourceDocumentId)
      chunkCountForStats = sourceDoc?.chunkCount || 0

      const relevantChunks = await retrieveRelevantChunks(prompt, sourceDocumentId, 8)
      retrievedCount = relevantChunks.length

      if (relevantChunks.length === 0) {
        return NextResponse.json(
          { message: 'No relevant content found in this document. Try a different request.' },
          { status: 404 }
        )
      }

      documentContext = relevantChunks.map((c) => c.text).join('\n\n---\n\n')
    }

    const fullPrompt = documentContext
      ? `${prompt}

Use ONLY the following source material to generate the questions -- do not use outside knowledge.

SOURCE MATERIAL:
"""
${documentContext}
"""

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
      : prompt
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    let attempt = await generateAndValidate(model, fullPrompt)

    // Retry once if Gemini returns invalid JSON or the wrong structure.
    if (!attempt.success) {
      console.warn('First Gemini response invalid, retrying with repair prompt:', attempt.error)

      const repairPrompt = `Your previous response was not valid. Here is what you returned:

${attempt.rawText}

This must be fixed to be ONLY a valid JSON array matching this exact schema:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": 0
  }
]

Return ONLY the corrected JSON array. No markdown, no explanation, no extra text.`

      attempt = await generateAndValidate(model, repairPrompt)
    }

    if (!attempt.success) {
      console.error('Gemini output failed validation after retry:', attempt)
      return NextResponse.json(
        {
          message:
            attempt.error === 'not_json'
              ? 'The AI did not return valid data. Please try again.'
              : 'The AI returned an unexpected question format. Please try again.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      questions: attempt.questions,
      rag: sourceDocumentId
        ? { totalChunks: chunkCountForStats, retrievedChunks: retrievedCount }
        : null
    })
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { message: 'Failed to generate questions. Please try again.' },
      { status: 500 }
    )
  }
}
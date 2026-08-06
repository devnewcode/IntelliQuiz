import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

// -----------------------------
// 1. SETUP
// -----------------------------
// Run this once in your project:
//    npm install zod
// Zod is free, open-source (MIT license), no signup, no API key needed.

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// -----------------------------
// 2. ZOD SCHEMA
// -----------------------------
// This describes exactly what a valid question object must look like.
// If Gemini's output doesn't match this shape, Zod will tell us exactly
// what's wrong instead of the app just crashing with a generic JSON error.

const QuestionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 options'),
  correctAnswer: z.number().int().min(0).max(3),
})

const QuestionsArraySchema = z.array(QuestionSchema).min(1, 'At least one question is required')

// -----------------------------
// 3. SIMPLE IN-MEMORY RATE LIMITER
// -----------------------------
// Limits each caller (by IP) to a max number of requests per time window.
// This is free and needs no external service — good enough for a
// resume/portfolio project. It resets if the server restarts, and won't
// work correctly across multiple server instances (fine for now).

const RATE_LIMIT_MAX_REQUESTS = 5      // max requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // per 1 minute

// Stores { ip: [timestamps] } in memory
const requestLog = new Map()

function isRateLimited(ip) {
  const now = Date.now()
  const timestamps = requestLog.get(ip) || []

  // Keep only requests within the current time window
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
  // Works on Vercel and most proxies; falls back to 'unknown' locally
  const forwardedFor = request.headers.get('x-forwarded-for')
  return forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
}

// -----------------------------
// 4. HELPER: ask Gemini and try to parse+validate the result
// -----------------------------

async function generateAndValidate(model, promptText) {
  const result = await model.generateContent(promptText)
  const rawText = result.response.text()
  const cleaned = rawText.replace(/```json|```/g, '').trim()

  let parsedJson
  try {
    parsedJson = JSON.parse(cleaned)
  } catch {
    // Not valid JSON at all
    return { success: false, error: 'not_json', rawText }
  }

  const validation = QuestionsArraySchema.safeParse(parsedJson)
  if (!validation.success) {
    // Valid JSON, but wrong shape (missing fields, wrong types, etc.)
    return {
      success: false,
      error: 'schema_mismatch',
      issues: validation.error.issues,
      rawText,
    }
  }

  return { success: true, questions: validation.data }
}

// -----------------------------
// 5. ROUTE HANDLER
// -----------------------------

export async function POST(request) {
  try {
    // ---- Rate limit check ----
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    const { topic, difficulty, count, prompt } = await request.json()

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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    // ---- First attempt ----
    let attempt = await generateAndValidate(model, fullPrompt)

    // ---- If it failed, ask Gemini to fix its own output (one retry) ----
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

    // ---- Still failed after retry: return a clear, specific error ----
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

    return NextResponse.json({ success: true, questions: attempt.questions })
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { message: 'Failed to generate questions. Please try again.' },
      { status: 500 }
    )
  }
}
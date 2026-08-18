import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini API key used for embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const EMBEDDING_MODEL = 'gemini-embedding-001'

// Must match the numDimensions setting in the Atlas Vector Search index
export const EMBEDDING_DIMENSIONS = 768

/**
 * Embeds a single piece of text (e.g. a search query / quiz topic).
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector
 */
export async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })

  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    outputDimensionality: EMBEDDING_DIMENSIONS
  })

  return result.embedding.values
}

/**
 * Embeds many chunks of text (e.g. all chunks of an uploaded document).
 * Processes in batches to stay under the batchEmbedContents request cap.
 * @param {string[]} texts
 * @returns {Promise<number[][]>} one embedding vector per input text, same order
 */
export async function embedBatch(texts) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
  const BATCH_SIZE = 100 // Max requests per batch

  const allEmbeddings = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const result = await model.batchEmbedContents({
      requests: batch.map((text) => ({
        content: { role: 'user', parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS
      }))
    })
    allEmbeddings.push(...result.embeddings.map((e) => e.values))
  }

  return allEmbeddings
}
const DEFAULT_CHUNK_SIZE_WORDS = 450 // ~600 tokens
const DEFAULT_OVERLAP_WORDS = 60     // ~80 tokens

/**
 * Splits extracted document text into overlapping word chunks.
 * @param {string} text
 * @param {object} [options]
 * @param {number} [options.chunkSizeWords]
 * @param {number} [options.overlapWords]
 * @returns {string[]}
 */
export function chunkText(text, options = {}) {
  const chunkSizeWords = options.chunkSizeWords ?? DEFAULT_CHUNK_SIZE_WORDS
  const overlapWords = options.overlapWords ?? DEFAULT_OVERLAP_WORDS

  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const words = normalized.split(' ')
  const chunks = []

  let start = 0
  while (start < words.length) {
    const end = Math.min(start + chunkSizeWords, words.length)
    const chunk = words.slice(start, end).join(' ')
    chunks.push(chunk)

    if (end === words.length) break
    start = end - overlapWords
  }

  return chunks
}
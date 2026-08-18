// Split long text into smaller overlapping chunks.
// Overlap keeps context from getting lost between chunks.

const DEFAULT_CHUNK_SIZE_WORDS = 450   // ~ 600 tokens
const DEFAULT_OVERLAP_WORDS = 60       // ~ 80 tokens of overlap between chunks

/**
 * @param {string} text - raw extracted document text
 * @param {object} [options]
 * @param {number} [options.chunkSizeWords]
 * @param {number} [options.overlapWords]
 * @returns {string[]} array of chunk strings, in original order
 */
export function chunkText(text, options = {}) {
  const chunkSizeWords = options.chunkSizeWords ?? DEFAULT_CHUNK_SIZE_WORDS
  const overlapWords = options.overlapWords ?? DEFAULT_OVERLAP_WORDS

  // Normalize whitespace before splitting into words
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

    // Move forward while keeping some words from the previous chunk
    start = end - overlapWords
  }

  return chunks
}
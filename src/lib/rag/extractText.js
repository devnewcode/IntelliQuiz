// Extracts plain text from uploaded PDF or DOCX files.
// RAG flow: extractText -> chunkText -> embed -> store

/**
 * @param {Buffer} fileBuffer - raw bytes of the uploaded file
 * @param {'pdf'|'docx'} fileType
 * @returns {Promise<string>} extracted plain text
 */
export async function extractText(fileBuffer, fileType) {
  if (fileType === 'pdf') {
    // Import the CanvasFactory before PDFParse so PDF.js
    // can initialize correctly in Node/Vercel.
    const { CanvasFactory } = await import('pdf-parse/worker')
    const { PDFParse } = await import('pdf-parse')

    const parser = new PDFParse({
      data: fileBuffer,
      CanvasFactory,
    })

    try {
      const result = await parser.getText()
      return result.text || ''
    } finally {
      await parser.destroy()
    }
  }

  if (fileType === 'docx') {
    const mammoth = (await import('mammoth')).default

    const { value } = await mammoth.extractRawText({
      buffer: fileBuffer,
    })

    return value
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}

/**
 * Figures out fileType from an uploaded File's name.
 * @param {string} fileName
 * @returns {'pdf'|'docx'|null}
 */
export function detectFileType(fileName) {
  const lower = fileName.toLowerCase()

  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx')) return 'docx'

  return null
}
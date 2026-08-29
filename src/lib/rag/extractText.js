/**
 * Extracts raw text from PDF or DOCX buffer.
 * @param {Buffer} fileBuffer
 * @param {'pdf'|'docx'} fileType
 * @returns {Promise<string>}
 */
export async function extractText(fileBuffer, fileType) {
  if (fileType === 'pdf') {
    // CanvasFactory must be imported before PDFParse for PDF.js runtime in Node
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
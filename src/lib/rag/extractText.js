// Extracts plain text from uploaded PDF or DOCX files.
// RAG flow: extractText -> chunkText -> embed -> store

import path from 'path'
import { pathToFileURL } from 'url'

/**
 * @param {Buffer} fileBuffer - raw bytes of the uploaded file
 * @param {'pdf'|'docx'} fileType
 * @returns {Promise<string>} extracted plain text
 */
export async function extractText(fileBuffer, fileType) {
  if (fileType === 'pdf') {
    // Use pdfjs-dist directly because pdf-parse has compatibility issues
    // with modern PDFs and Next.js server bundling.
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs')

    // Set the worker path manually because Next.js can change the bundled path.
    if (!GlobalWorkerOptions.workerSrc) {
      GlobalWorkerOptions.workerSrc = pathToFileURL(
        path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
      ).href
    }

    const doc = await getDocument({
      data: new Uint8Array(fileBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true
    }).promise

    let fullText = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      fullText += content.items.map((item) => item.str).join(' ') + '\n'
    }
    return fullText
  }

  if (fileType === 'docx') {
    const mammoth = (await import('mammoth')).default
    const { value } = await mammoth.extractRawText({ buffer: fileBuffer })
    return value
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}

/**
 * Figures out fileType from an uploaded File's name/mime type.
 * @param {string} fileName
 * @returns {'pdf'|'docx'|null}
 */
export function detectFileType(fileName) {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx')) return 'docx'
  return null
}
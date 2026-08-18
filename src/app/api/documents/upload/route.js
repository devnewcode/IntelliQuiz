export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/mongodb'
import SourceDocument from '../../../../lib/models/SourceDocument'
import DocumentChunk from '../../../../lib/models/DocumentChunk'
import { verifyToken } from '../../../../lib/auth'
import { extractText, detectFileType } from '../../../../lib/rag/extractText'
import { chunkText } from '../../../../lib/rag/chunkText'
import { embedBatch } from '../../../../lib/rag/embed'

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB

export async function POST(request) {
  try {
    // Auth: admin only
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse uploaded file
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: 'File too large (max 15MB)' },
        { status: 400 }
      )
    }

    const fileType = detectFileType(file.name)

    if (!fileType) {
      return NextResponse.json(
        {
          message:
            'Unsupported file type. Please upload a PDF or DOCX file.',
        },
        { status: 400 }
      )
    }

    await dbConnect()

    // Create source document
    const sourceDocument = await SourceDocument.create({
      fileName: file.name,
      fileType,
      status: 'processing',
      uploadedBy: decoded.id,
    })

    try {
      // Extract -> chunk -> embed -> store
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      const rawText = await extractText(fileBuffer, fileType)

      if (!rawText || rawText.trim().length < 50) {
        throw new Error('Could not extract meaningful text from this file.')
      }

      const chunks = chunkText(rawText)

      if (chunks.length === 0) {
        throw new Error('Document produced no chunks after processing.')
      }

      const embeddings = await embedBatch(chunks)

      const chunkDocs = chunks.map((text, i) => ({
        sourceDocument: sourceDocument._id,
        text,
        chunkIndex: i,
        embedding: embeddings[i],
        createdBy: decoded.id,
      }))

      await DocumentChunk.insertMany(chunkDocs)

      sourceDocument.status = 'ready'
      sourceDocument.chunkCount = chunkDocs.length
      await sourceDocument.save()

      return NextResponse.json({
        success: true,
        message: 'Document processed successfully!',
        sourceDocument: {
          id: sourceDocument._id,
          fileName: sourceDocument.fileName,
          chunkCount: sourceDocument.chunkCount,
          status: sourceDocument.status,
        },
      })
    } catch (processingError) {
      console.error('Document processing error:', processingError)

      sourceDocument.status = 'failed'
      sourceDocument.errorMessage = processingError.message
      await sourceDocument.save()

      return NextResponse.json(
        {
          message:
            'Failed to process document. Please try a different file.',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Document upload error:', error)

    return NextResponse.json(
      { message: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
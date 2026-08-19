import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/mongodb'
import SourceDocument from '../../../../lib/models/SourceDocument'
import DocumentChunk from '../../../../lib/models/DocumentChunk'
import { verifyToken } from '../../../../lib/auth'

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    await dbConnect()

    const docs = await SourceDocument.find({ uploadedBy: decoded.id }).select('_id')
    const docIds = docs.map((d) => d._id)

    await Promise.all([
      DocumentChunk.deleteMany({ sourceDocument: { $in: docIds } }),
      SourceDocument.deleteMany({ uploadedBy: decoded.id })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear documents error:', error)
    return NextResponse.json({ message: 'Failed to clear documents' }, { status: 500 })
  }
}

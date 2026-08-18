import dbConnect from '../mongodb'
import SourceDocument from '../models/SourceDocument'
import DocumentChunk from '../models/DocumentChunk'

// Remove document data after quiz generation so unused chunks don't pile up.
// Safe to call with an invalid or already deleted ID.

 /**
 * @param {string} sourceDocumentId
 */
export async function deleteSourceDocument(sourceDocumentId) {
  if (!sourceDocumentId) return

  await dbConnect()

  await Promise.all([
    DocumentChunk.deleteMany({ sourceDocument: sourceDocumentId }),
    SourceDocument.deleteOne({ _id: sourceDocumentId })
  ])
}
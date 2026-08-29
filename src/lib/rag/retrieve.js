import mongoose from 'mongoose'
import dbConnect from '../mongodb'
import DocumentChunk from '../models/DocumentChunk'
import { embedText } from './embed'

// Must match the Vector Search index name in MongoDB Atlas
const VECTOR_INDEX_NAME = 'vector_index'

/**
 * Retrieves top-K most semantically relevant chunks for a document.
 * @param {string} query
 * @param {string} sourceDocumentId
 * @param {number} [topK=8]
 * @returns {Promise<{text: string, chunkIndex: number}[]>}
 */
export async function retrieveRelevantChunks(query, sourceDocumentId, topK = 8) {
  await dbConnect()

  const queryEmbedding = await embedText(query)

  const results = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: topK * 15,
        limit: topK,
        filter: {
          sourceDocument: new mongoose.Types.ObjectId(sourceDocumentId)
        }
      }
    },
    {
      $project: {
        text: 1,
        chunkIndex: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ])

  return results
}
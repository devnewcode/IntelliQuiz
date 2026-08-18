import mongoose from 'mongoose'
import dbConnect from '../mongodb'
import DocumentChunk from '../models/DocumentChunk'
import { embedText } from './embed'

// Must match the Vector Search index name in MongoDB Atlas
const VECTOR_INDEX_NAME = 'vector_index'

/**
 * Embeds a query (e.g. quiz topic) and finds the most semantically
 * similar chunks previously stored for a given source document.
 *
 * @param {string} query - e.g. the topic/prompt the admin typed
 * @param {string} sourceDocumentId - restrict search to one uploaded doc
 * @param {number} [topK] - how many chunks to retrieve
 * @returns {Promise<{text: string, chunkIndex: number}[]>}
 */
export async function retrieveRelevantChunks(query, sourceDocumentId, topK = 8) {
  await dbConnect()

  const queryEmbedding = await embedText(query)

  // Search embeddings first, then restrict results to the selected document.
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
import mongoose from 'mongoose'

// Stores one chunk of a document along with its embedding.
const DocumentChunkSchema = new mongoose.Schema({
  // Links this chunk to its source document.
  sourceDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SourceDocument',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  // Position of the chunk in the original document.
  chunkIndex: {
    type: Number,
    required: true
  },
  // Embedding vector used for semantic search.
  // Must match the dimensions of the Atlas Vector Search index.
  embedding: {
    type: [Number],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.models.DocumentChunk || mongoose.model('DocumentChunk', DocumentChunkSchema)
import mongoose from 'mongoose'

const DocumentChunkSchema = new mongoose.Schema({
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
  chunkIndex: {
    type: Number,
    required: true
  },
  // Vector array indexed in MongoDB Atlas
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
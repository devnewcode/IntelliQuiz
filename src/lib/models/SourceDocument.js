import mongoose from 'mongoose'

const SourceDocumentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },

  fileType: {
    type: String,
    enum: ['pdf', 'docx'],
    required: true
  },

  chunkCount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing'
  },

  errorMessage: {
    type: String,
    default: ''
  },

  uploadedBy: {
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

export default mongoose.models.SourceDocument || mongoose.model('SourceDocument', SourceDocumentSchema)
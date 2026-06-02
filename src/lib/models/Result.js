import mongoose from 'mongoose'
import './Quiz'
import './User'

const ResultSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true

    //for guest use as well
    required: false

  },
  answers: [{
    questionId: String,
    selectedOption: Number,
    isCorrect: Boolean
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  guestName: { type: String, default: '' },
  guestEmail: { type: String, default: '' }
})

ResultSchema.index({ quiz: 1, user: 1 })

export default mongoose.models.Result || mongoose.model('Result', ResultSchema)
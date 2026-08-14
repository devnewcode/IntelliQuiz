
function gradeQuiz(questions, submittedAnswers) {
  // questions: the REAL questions from the database, each shaped like:
  //   { _id, question, options: [string, string, string, string], correctAnswer: number }
  // submittedAnswers: what the player picked, shaped like:
  //   [{ questionId, selectedOptionText }]

  const submittedByQuestionId = new Map(
    submittedAnswers.map((a) => [String(a.questionId), a.selectedOptionText])
  )

  let correctCount = 0

  const review = questions.map((q) => {
    const questionId = String(q._id)
    const selectedOptionText = submittedByQuestionId.get(questionId) ?? null
    const correctOptionText = q.options[q.correctAnswer]
    const selectedOptionIndex =
      selectedOptionText != null ? q.options.findIndex((opt) => opt === selectedOptionText) : -1
    const isCorrect = selectedOptionText != null && selectedOptionText === correctOptionText

    if (isCorrect) correctCount++

    return {
      questionId,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      correctAnswerText: correctOptionText,
      selectedOptionText,
      selectedOptionIndex,
      isCorrect,
    }
  })

  const totalQuestions = questions.length
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  return { score, correctCount, totalQuestions, review }
}

export { gradeQuiz }

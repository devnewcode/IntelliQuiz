import { gradeQuiz } from './scoring'

describe('gradeQuiz', () => {
  const questions = [
    { _id: 'q1', question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
    { _id: 'q2', question: 'Q2?', options: ['W', 'X', 'Y', 'Z'], correctAnswer: 2 },
  ]

  test('scores 100% when every answer is correct', () => {
    const answers = [
      { questionId: 'q1', selectedOptionText: 'B' },
      { questionId: 'q2', selectedOptionText: 'Y' },
    ]
    const result = gradeQuiz(questions, answers)
    expect(result.score).toBe(100)
    expect(result.correctCount).toBe(2)
  })

  test('scores 0% when every answer is wrong', () => {
    const answers = [
      { questionId: 'q1', selectedOptionText: 'A' },
      { questionId: 'q2', selectedOptionText: 'W' },
    ]
    const result = gradeQuiz(questions, answers)
    expect(result.score).toBe(0)
    expect(result.correctCount).toBe(0)
  })

  test('scores 50% with one correct and one wrong', () => {
    const answers = [
      { questionId: 'q1', selectedOptionText: 'B' },
      { questionId: 'q2', selectedOptionText: 'W' },
    ]
    const result = gradeQuiz(questions, answers)
    expect(result.score).toBe(50)
  })

  test('treats a missing answer as unanswered, not correct', () => {
    const answers = [{ questionId: 'q1', selectedOptionText: 'B' }]
    const result = gradeQuiz(questions, answers)
    expect(result.score).toBe(50)
    expect(result.review[1].isCorrect).toBe(false)
    expect(result.review[1].selectedOptionIndex).toBe(-1)
  })

  // Regression: numeric answer fields shouldn't throw or falsely award points
  test('an unexpected field name is treated as unanswered, not as a crash', () => {
    const answers = [{ questionId: 'q1', selectedOption: 1 }]
    const result = gradeQuiz(questions, answers)
    expect(result.score).toBe(0)
    expect(result.review[0].isCorrect).toBe(false)
  })
})

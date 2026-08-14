

import { gradeQuiz } from './scoring'

describe('gradeQuiz', () => {
  // Fake questions
  const questions = [
    { _id: 'q1', question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 }, // correct = 'B'
    { _id: 'q2', question: 'Q2?', options: ['W', 'X', 'Y', 'Z'], correctAnswer: 2 }, // correct = 'Y'
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
      { questionId: 'q1', selectedOptionText: 'B' }, // correct
      { questionId: 'q2', selectedOptionText: 'W' }, // wrong
    ]
    const result = gradeQuiz(questions, answers)
    expect(result.score).toBe(50)
  })

  test('treats a missing answer as unanswered, not correct', () => {
    // q2 was never submitted at all
    const answers = [{ questionId: 'q1', selectedOptionText: 'B' }]
    const result = gradeQuiz(questions, answers)
    expect(result.score).toBe(50)
    expect(result.review[1].isCorrect).toBe(false)
    expect(result.review[1].selectedOptionIndex).toBe(-1)
  })

  // previsouly the student page was sending `selectedOption` (a number) instead of `selectedOptionText` (the actual text), and everyone's dashboard
  // silently showed 0%. so i made this test that locks in the correct behavior so if
  // that mistake ever happens again, this test fails immediately instead
  // of quietly shipping a broken score to production.
  test('an unexpected field name is treated as unanswered, not as a crash', () => {
    const answers = [{ questionId: 'q1', selectedOption: 1 }] // wrong field name, on purpose
    const result = gradeQuiz(questions, answers)
    expect(result.score).toBe(0)
    expect(result.review[0].isCorrect).toBe(false)
  })
})

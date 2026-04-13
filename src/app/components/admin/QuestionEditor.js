'use client'
import { useState } from 'react'
import styles from '../../admin/page.module.css'

// Manual question adding + questions summary list + save quiz button.
// here props are:
//   questions    — current questions array on the quiz being built
//   onAdd        — (question) => void  add a new question
//   onRemove     — (id) => void  remove a question
//   onSave       — () => void  save the whole quiz
//   isSubmitting — boolean

export default function QuestionEditor({ questions, onAdd, onRemove, onSave, isSubmitting }) {
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '', options: ['', '', '', ''], correctAnswer: 0
  })

  const handleAdd = () => {
    if (!currentQuestion.question.trim() || currentQuestion.options.some(o => !o.trim())) {
      alert('Please fill all question fields'); return
    }
    onAdd({ ...currentQuestion, id: Date.now().toString() })
    setCurrentQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionTitle}>Add Question Manually</h3>

      {/* Question text */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Question</label>
        <textarea
          className={styles.textarea}
          value={currentQuestion.question}
          onChange={e => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
          placeholder="Enter your question here..."
          disabled={isSubmitting}
          rows="4" />
        <span className={styles.inputHint}>
          Tip: You can write multi-line questions, code examples, or detailed explanations.
        </span>
      </div>

      {/* Options */}
      {currentQuestion.options.map((option, index) => (
        <div key={index} className={styles.formGroup}>
          <label className={styles.label}>Option {index + 1}</label>
          <div className={styles.radioGroup}>
            <input
              className={styles.input}
              type="text"
              value={option}
              onChange={e => {
                const opts = [...currentQuestion.options]
                opts[index] = e.target.value
                setCurrentQuestion({ ...currentQuestion, options: opts })
              }}
              placeholder={`Enter option ${index + 1}`}
              disabled={isSubmitting} />
            <input
              className={styles.radioInput}
              type="radio"
              name="correctAnswer"
              checked={currentQuestion.correctAnswer === index}
              onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
              disabled={isSubmitting} />
            <span className={styles.radioLabel}>Correct</span>
          </div>
        </div>
      ))}

      <button
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={handleAdd}
        disabled={isSubmitting}>
        + Add Question
      </button>

      {/* Questions summary */}
      {questions.length > 0 && (
        <div className={styles.questionsSummary}>
          <h3 className={styles.summaryTitle}>Questions Added ({questions.length})</h3>
          {questions.map((question, index) => (
            <div key={question.id} className={styles.questionCard}>
              <div className={styles.questionHeader}>Question {index + 1}</div>
              <div className={styles.questionText}>{question.question}</div>
              <div className={styles.optionList}>
                {question.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`${styles.optionItem} ${question.correctAnswer === i ? styles.correctOption : ''}`}>
                    {i + 1}. {opt}{question.correctAnswer === i && ' ✓'}
                  </div>
                ))}
              </div>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => onRemove(question.id)}
                disabled={isSubmitting}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save quiz button */}
      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #f1f5f9' }}>
        <button
          className={`${styles.btn} ${styles.btnSuccess}`}
          onClick={onSave}
          disabled={isSubmitting}>
          {isSubmitting ? 'Creating Quiz...' : '✓ Create Quiz'}
        </button>
      </div>
    </div>
  )
}
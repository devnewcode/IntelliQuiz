'use client'
import { useState } from 'react'
import styles from '../../admin/page.module.css'

// This component shows existing quizzes with delete button and inline preview toggle.
// Here Props are:
//   quizzes      — array of quiz objects
//   onDelete     — (quizId, quizTitle) => void
//   isSubmitting — boolean

export default function AdminQuizList({ quizzes, onDelete, isSubmitting }) {
  const [previewQuizId, setPreviewQuizId] = useState(null)

  if (quizzes.length === 0) {
    return (
      <div className={styles.emptyState}>No quizzes created yet.</div>
    )
  }

  return (
    <>
      {quizzes.map(quiz => (
        <div key={quiz._id} className={styles.quizItem}>

          {/* Quiz info */}
          <h3 className={styles.quizTitle}>{quiz.title}</h3>
          <p className={styles.quizInfo}>
            <span className={styles.quizLabel}>Description: </span>{quiz.description}
          </p>
          <p className={styles.quizInfo}>
            <span className={styles.quizLabel}>Category: </span>{quiz.category}
          </p>
          <p className={styles.quizInfo}>
            <span className={styles.quizLabel}>Difficulty: </span>{quiz.difficulty}
          </p>
          <p className={styles.quizInfo}>
            <span className={styles.quizLabel}>Questions: </span>{quiz.questions.length}
          </p>
          <p className={styles.quizInfo}>
            <span className={styles.quizLabel}>Timer: </span>
            {quiz.timerEnabled ? `${quiz.timeLimit} minutes` : 'Disabled'}
          </p>
          <p className={styles.quizInfo}>
            <span className={styles.quizLabel}>Created: </span>
            {new Date(quiz.createdAt).toLocaleDateString()}
          </p>
          <p className={styles.quizInfo}>
            <span className={styles.quizLabel}>By: </span>
            {quiz.createdBy?.name || 'Unknown'}
          </p>

          {/* Actions */}
          <div className={styles.quizActions}>
            <button
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => onDelete(quiz._id, quiz.title)}
              disabled={isSubmitting}>
              Delete Quiz
            </button>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => setPreviewQuizId(previewQuizId === quiz._id ? null : quiz._id)}>
              {previewQuizId === quiz._id ? 'Hide Questions' : 'Preview Questions'}
            </button>
          </div>

          {/* Inline questions preview panel */}
          {previewQuizId === quiz._id && (
            <div className={styles.questionsSummary} style={{ marginTop: '20px' }}>
              <h3 className={styles.summaryTitle}>
                {quiz.questions.length} Question{quiz.questions.length !== 1 ? 's' : ''}
              </h3>
              {quiz.questions.map((q, i) => (
                <div key={q._id || i} className={styles.questionCard}>
                  <div className={styles.questionHeader}>Question {i + 1}</div>
                  <div className={styles.questionText}>{q.question}</div>
                  <div className={styles.optionList}>
                    {q.options.map((opt, j) => (
                      <div
                        key={j}
                        className={`${styles.optionItem} ${q.correctAnswer === j ? styles.correctOption : ''}`}>
                        {j + 1}. {opt}{q.correctAnswer === j && ' ✓'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  )
}
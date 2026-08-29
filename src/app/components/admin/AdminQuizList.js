'use client'
import { useState } from 'react'
import styles from '../../admin/page.module.css'

export default function AdminQuizList({ quizzes, onDelete, isSubmitting }) {
  const [previewQuizId, setPreviewQuizId] = useState(null)

  const getDifficultyClass = (diff) => {
    if (diff === 'easy') return styles.diffEasy
    if (diff === 'hard') return styles.diffHard
    return styles.diffMedium
  }

  if (quizzes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
        <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No quizzes found</p>
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
          Switch to the &ldquo;Create New Quiz&rdquo; tab to create your first quiz!
        </p>
      </div>
    )
  }

  return (
    <div className={styles.quizListContainer}>
      {quizzes.map(quiz => {
        const isPreviewing = previewQuizId === quiz._id
        const isPublicWithPasscode = quiz.isPublic && (quiz.passcode || quiz.hasPasscode)
        const isPublicNoPasscode = quiz.isPublic && !quiz.passcode && !quiz.hasPasscode

        return (
          <div key={quiz._id} className={styles.quizItem}>
            <div className={styles.quizHeaderRow}>
              <div>
                <h3 className={styles.quizTitle}>{quiz.title}</h3>
                {quiz.description && (
                  <p className={styles.quizDescription}>{quiz.description}</p>
                )}
              </div>

              <div className={styles.quizActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setPreviewQuizId(isPreviewing ? null : quiz._id)}>
                  {isPreviewing ? 'Hide Questions' : `👁️ Preview (${quiz.questions?.length || 0})`}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => onDelete(quiz._id, quiz.title)}
                  disabled={isSubmitting}>
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div className={styles.quizBadgeRow}>
              <span className={styles.metaBadge}>
                📁 {quiz.category || 'General'}
              </span>

              <span className={`${styles.metaBadge} ${getDifficultyClass(quiz.difficulty)}`}>
                {quiz.difficulty ? quiz.difficulty.toUpperCase() : 'MEDIUM'}
              </span>

              <span className={styles.metaBadge}>
                📝 {quiz.questions?.length || 0} Questions
              </span>

              <span className={styles.metaBadge}>
                {quiz.timerEnabled ? `⏰ ${quiz.timeLimit} mins` : '∞ No Timer'}
              </span>

              {isPublicWithPasscode ? (
                <span className={`${styles.metaBadge} ${styles.accessPasscode}`}>
                  🔒 Passcode: {quiz.passcode || 'Required'}
                </span>
              ) : isPublicNoPasscode ? (
                <span className={`${styles.metaBadge} ${styles.accessPublic}`}>
                  🌐 Public Play
                </span>
              ) : (
                <span className={`${styles.metaBadge} ${styles.accessPrivate}`}>
                  🎓 Students Only
                </span>
              )}
            </div>

            <div className={styles.quizFooterMeta}>
              <span>Created by: <strong>{quiz.createdBy?.name || 'Admin'}</strong></span>
              <span>•</span>
              <span>{new Date(quiz.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>

            {isPreviewing && (
              <div className={styles.previewDrawer}>
                <div className={styles.previewDrawerHeader}>
                  <h4>Questions in this Quiz ({quiz.questions?.length || 0})</h4>
                </div>

                <div className={styles.previewDrawerList}>
                  {quiz.questions?.map((q, i) => (
                    <div key={q._id || i} className={styles.previewQuestionCard}>
                      <div className={styles.questionHeader}>Question {i + 1}</div>
                      <div className={styles.questionText}>{q.question}</div>
                      <div className={styles.optionList}>
                        {q.options?.map((opt, j) => (
                          <div
                            key={j}
                            className={`${styles.optionItem} ${q.correctAnswer === j ? styles.correctOption : ''}`}>
                            <span>{j + 1}.</span> {opt}
                            {q.correctAnswer === j && <span className={styles.correctCheck}>✓ Correct</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )
      })}
    </div>
  )
}
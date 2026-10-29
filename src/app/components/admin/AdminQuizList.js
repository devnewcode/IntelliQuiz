'use client'
import { useState } from 'react'
import styles from '../../admin/page.module.css'

export default function AdminQuizList({ quizzes, onEdit, onDelete, isSubmitting }) {
  const [previewQuizId, setPreviewQuizId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const getDifficultyClass = (diff) => {
    if (diff === 'easy') return styles.diffEasy
    if (diff === 'hard') return styles.diffHard
    return styles.diffMedium
  }

  const copyCode = (code, id) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
                  {isPreviewing ? 'Hide' : `Preview (${quiz.questions?.length || 0})`}
                </button>
                {onEdit && (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => onEdit(quiz)}
                    disabled={isSubmitting}>
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => onDelete(quiz._id, quiz.title)}
                  disabled={isSubmitting}>
                  Delete
                </button>
              </div>
            </div>

            <div className={styles.quizBadgeRow}>
              {quiz.quizCode && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--purple-12)',
                  padding: '2.5px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--purple-25)',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary-200)', fontFamily: 'monospace' }}>
                    CODE: {quiz.quizCode}
                  </span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--primary-300)', cursor: 'pointer', fontSize: '10.5px', fontWeight: 600, padding: '0 2px' }}
                    onClick={() => copyCode(quiz.quizCode, quiz._id)}>
                    {copiedId === quiz._id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              <span className={styles.metaBadge}>
                {quiz.category || 'General'}
              </span>

              <span className={`${styles.metaBadge} ${getDifficultyClass(quiz.difficulty)}`}>
                {quiz.difficulty ? quiz.difficulty.toUpperCase() : 'MEDIUM'}
              </span>

              <span className={styles.metaBadge}>
                {quiz.questions?.length || 0} Questions
              </span>

              <span className={styles.metaBadge}>
                {quiz.timerEnabled ? `${quiz.timeLimit} mins` : 'No Timer'}
              </span>

              {quiz.isPublic ? (
                <span className={`${styles.metaBadge} ${styles.accessPublic}`}>
                  Public Feed
                </span>
              ) : (
                <span className={`${styles.metaBadge} ${styles.accessPrivate}`}>
                  Private (Code Only)
                </span>
              )}

              {quiz.isPublic && (quiz.passcode || quiz.hasPasscode) && (
                <span className={`${styles.metaBadge} ${styles.accessPasscode}`}>
                  Passcode Protected
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
                  <h4>Quiz Questions Preview ({quiz.questions?.length || 0})</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Correct answer is highlighted in green
                  </span>
                </div>

                <div className={styles.previewQuestionList}>
                  {(quiz.questions || []).map((q, idx) => (
                    <div key={idx} className={styles.previewQuestionCard}>
                      <div className={styles.previewQuestionNumber}>Question {idx + 1}</div>
                      <div className={styles.previewQuestionTitle}>{q.question}</div>
                      <div className={styles.previewOptionsGrid}>
                        {(q.options || []).map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`${styles.previewOption} ${q.correctAnswer === optIdx ? styles.previewOptionCorrect : ''}`}>
                            <span className={styles.previewOptionLetter}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                            {q.correctAnswer === optIdx && <span className={styles.previewCorrectBadge}>✓ Correct</span>}
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

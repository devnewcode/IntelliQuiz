'use client'
import { useState, useEffect } from 'react'
import styles from '../../student/page.module.css'

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function QuizTaking({
  quiz,
  currentQuestionIndex,
  answers,
  timeLeft,
  timeExpired,
  isSubmitting,
  showTabWarning,
  tabSwitchCount,
  onAnswer,
  onNext,
  onPrev,
  onNavigateTo,
  onSubmit,
  onExit,
  onDismissWarning,
}) {
  const [flagged, setFlagged] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const currentQuestion = quiz?.questions?.[currentQuestionIndex]
  const questionId = currentQuestion?._id || currentQuestion?.id || currentQuestionIndex.toString()
  const progress = quiz?.questions?.length ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0
  const answeredCount = Object.keys(answers).length
  const remainingCount = (quiz?.questions?.length || 0) - answeredCount

  const toggleFlag = (qid) => {
    setFlagged(prev => ({ ...prev, [qid]: !prev[qid] }))
  }

  const handleOpenConfirm = () => {
    setShowConfirmModal(true)
  }

  const handleFinalSubmit = () => {
    setShowConfirmModal(false)
    onSubmit()
  }

  const handleJumpToUnanswered = () => {
    setShowConfirmModal(false)
    const firstUnansweredIndex = quiz.questions.findIndex((q, i) => {
      const qid = q._id || q.id || i.toString()
      return answers[qid] === undefined
    })
    if (firstUnansweredIndex !== -1) {
      onNavigateTo(firstUnansweredIndex)
    }
  }

  useEffect(() => {
    if (!currentQuestion || isSubmitting || timeExpired) return

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return

      const key = e.key.toLowerCase()

      if (['1', '2', '3', '4'].includes(key)) {
        const optIdx = parseInt(key, 10) - 1
        if (optIdx < (currentQuestion.options?.length || 0)) {
          onAnswer(questionId, optIdx)
        }
      } else if (['a', 'b', 'c', 'd'].includes(key)) {
        const optIdx = key.charCodeAt(0) - 97
        if (optIdx < (currentQuestion.options?.length || 0)) {
          onAnswer(questionId, optIdx)
        }
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        if (currentQuestionIndex < quiz.questions.length - 1) {
          onNext()
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        if (currentQuestionIndex > 0) {
          onPrev()
        }
      } else if (key === 'f') {
        toggleFlag(questionId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentQuestion, currentQuestionIndex, questionId, isSubmitting, timeExpired, quiz?.questions?.length, onAnswer, onNext, onPrev])

  if (!currentQuestion) {
    return (
      <div className={styles.container}>
        <div className={styles.alertError}>Error loading question.</div>
      </div>
    )
  }

  const getDifficultyTag = (d) =>
    d === 'easy' ? styles.metaTagGreen :
    d === 'hard' ? styles.metaTagRed :
    styles.metaTagAmber

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div
      className={styles.container}
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.ctrlKey && ['c', 'v', 'u', 's'].includes(e.key.toLowerCase()))
          e.preventDefault()
        if (e.key === 'F12') e.preventDefault()
      }}
    >

      {/* Nav */}
      <div className={styles.nav}>
        <h1 className={styles.navTitle}>{quiz.title}</h1>
        <div className={styles.navRight}>
          {quiz.timerEnabled && timeLeft !== null && !timeExpired && (
            <span className={timeLeft < 300 ? styles.timerWarning : styles.timerNormal}>
              ⏰ {formatTime(timeLeft)}
            </span>
          )}
          <button className={styles.navBtnDanger} onClick={onExit}>
            Exit Quiz
          </button>
        </div>
      </div>

      {/* Alerts */}
      {quiz.timerEnabled && timeLeft !== null && timeLeft < 300 && !timeExpired && (
        <div className={styles.alertWarning}>⚠️ Less than 5 minutes remaining!</div>
      )}
      {timeExpired && (
        <div className={styles.alertExpired}>⏰ Time expired! Submitting your quiz...</div>
      )}
      {showTabWarning && tabSwitchCount < 2 && (
        <div className={styles.alertWarning}>
          ⚠️ Warning ({tabSwitchCount}/2) — You switched tabs! Do it again and your quiz will be auto-submitted.
          <button
            onClick={onDismissWarning}
            style={{ marginLeft: 12, cursor: 'pointer', fontWeight: 600 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Question dots */}
      <div className={styles.dotsNav}>
        {quiz.questions.map((_, i) => {
          const qid = quiz.questions[i]._id || quiz.questions[i].id || i.toString()
          const isFlagged = Boolean(flagged[qid])
          const isAnswered = answers[qid] !== undefined

          return (
            <button
              key={i}
              className={`${styles.dot}
                ${i === currentQuestionIndex ? styles.dotCurrent : ''}
                ${isAnswered && i !== currentQuestionIndex ? styles.dotAnswered : ''}
                ${isFlagged ? styles.dotFlagged : ''}
              `}
              title={`Question ${i + 1}${isFlagged ? ' (Flagged)' : ''}${isAnswered ? ' (Answered)' : ''}`}
              onClick={() => !isSubmitting && !timeExpired && onNavigateTo(i)}>
              {isFlagged ? `🚩${i + 1}` : i + 1}
            </button>
          )
        })}
      </div>

      {/* Question card */}
      <div className={styles.questionCard}>
        <div className={styles.questionMeta}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={styles.questionNum}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <button
              type="button"
              className={`${styles.flagBtn} ${flagged[questionId] ? styles.flagBtnActive : ''}`}
              onClick={() => toggleFlag(questionId)}
              title="Shortcut: Press 'F' to flag">
              {flagged[questionId] ? '🚩 Flagged' : '🏳️ Flag for Review'}
            </button>
          </div>
          <div className={styles.questionTags}>
            <span className={`${styles.metaTag} ${getDifficultyTag(quiz.difficulty)}`}>
              {quiz.difficulty ? quiz.difficulty.toUpperCase() : 'MEDIUM'}
            </span>
            <span className={styles.metaTag}>{quiz.category || 'General'}</span>
          </div>
        </div>

        <div className={styles.questionText}>{currentQuestion.question}</div>

        <div className={styles.optionsList}>
          {currentQuestion.options?.map((option, i) => {
            const isSelected = answers[questionId] === i
            return (
              <div
                key={i}
                className={`${styles.optionItem}
                  ${isSelected ? styles.optionSelected : ''}
                  ${isSubmitting || timeExpired ? styles.optionDisabled : ''}
                `}
                onClick={() => onAnswer(questionId, i)}>
                <span className={styles.optionLetterBadge}>
                  {OPTION_KEYS[i] || i + 1}
                </span>
                <div className={`${styles.optionRadio} ${isSelected ? styles.optionRadioSelected : ''}`} />
                <span className={`${styles.optionText} ${isSelected ? styles.optionTextSelected : ''}`}>
                  {option}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation buttons & Progress stats */}
      <div className={styles.quizNav}>
        <button
          className={styles.btnNav}
          onClick={onPrev}
          disabled={currentQuestionIndex === 0 || isSubmitting || timeExpired}>
          ← Previous
        </button>

        <span className={styles.answeredStatusText}>
          {answeredCount}/{quiz.questions.length} answered {remainingCount > 0 && `(${remainingCount} remaining)`}
        </span>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <button
            className={styles.btnNav}
            onClick={onNext}
            disabled={isSubmitting || timeExpired}>
            Next →
          </button>
        ) : (
          <button
            className={styles.btnSubmit}
            onClick={handleOpenConfirm}
            disabled={isSubmitting || timeExpired}>
            {isSubmitting ? '⏳ Submitting...' : '✓ Submit Quiz'}
          </button>
        )}
      </div>

      <div className={styles.keyboardHintPill}>
        <span>⌨️ Shortcuts: <strong>1–4</strong> (or <strong>A–D</strong>) to select • <strong>← / →</strong> to navigate • <strong>F</strong> to flag</span>
      </div>

      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>
              {remainingCount > 0 ? '⚠️ Unanswered Questions' : 'Ready to Submit?'}
            </div>
            <div className={styles.modalText}>
              {remainingCount > 0 ? (
                <>
                  You still have <strong>{remainingCount}</strong> unanswered question{remainingCount > 1 ? 's' : ''}.
                  Unanswered questions will be scored as incorrect. Would you like to review them first?
                </>
              ) : (
                <>
                  You have answered all <strong>{quiz.questions.length}</strong> questions!
                  Are you ready to finalize and view your score and explanations?
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              {remainingCount > 0 && (
                <button
                  type="button"
                  className={styles.btnNav}
                  onClick={handleJumpToUnanswered}>
                  Review Unanswered
                </button>
              )}
              <button
                type="button"
                className={styles.btnNav}
                onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={handleFinalSubmit}>
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

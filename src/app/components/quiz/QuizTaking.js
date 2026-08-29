'use client'
import { useEffect } from 'react'
import styles from '../../student/page.module.css'

// Quiz taking interface with options, timer, progress bar, dots nav,
// and keyboard navigation support (1-4, Arrow Left/Right).
// Props:
//   quiz                 — selected quiz object (with shuffled questions)
//   currentQuestionIndex — which question is active
//   answers              — { questionId: selectedOptionIndex }
//   timeLeft             — seconds remaining (null if no timer)
//   timeExpired          — boolean
//   isSubmitting         — boolean
//   showTabWarning       — boolean
//   tabSwitchCount       — number
//   onAnswer             — (questionId, optionIndex) => void
//   onNext               — () => void
//   onPrev               — () => void
//   onNavigateTo         — (index) => void
//   onSubmit             — () => void
//   onExit               — () => void
//   onDismissWarning     — () => void

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
  const currentQuestion = quiz?.questions?.[currentQuestionIndex]

  const questionId = currentQuestion?._id || currentQuestion?.id || currentQuestionIndex.toString()
  const progress = quiz?.questions?.length ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0
  const answeredCount = Object.keys(answers).length
  const remainingCount = (quiz?.questions?.length || 0) - answeredCount

  // ── Keyboard Shortcuts (1-4 / A-D and Arrow Keys) ──
  useEffect(() => {
    if (!currentQuestion || isSubmitting || timeExpired) return

    const handleKeyDown = (e) => {
      // Don't intercept if user is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return

      const key = e.key.toLowerCase()

      // Option selection by 1-4 or a-d
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
          return (
            <button
              key={i}
              className={`${styles.dot}
                ${i === currentQuestionIndex ? styles.dotCurrent : ''}
                ${answers[qid] !== undefined && i !== currentQuestionIndex ? styles.dotAnswered : ''}
              `}
              onClick={() => !isSubmitting && !timeExpired && onNavigateTo(i)}>
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Question card */}
      <div className={styles.questionCard}>
        <div className={styles.questionMeta}>
          <span className={styles.questionNum}>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
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
            onClick={onSubmit}
            disabled={isSubmitting || timeExpired}>
            {isSubmitting ? '⏳ Submitting...' : '✓ Submit Quiz'}
          </button>
        )}
      </div>

      {/* Keyboard Shortcut Hint Pill */}
      <div className={styles.keyboardHintPill}>
        <span>⌨️ Shortcuts: Press <strong>1–4</strong> (or <strong>A–D</strong>) to select • <strong>← / →</strong> to navigate</span>
      </div>

    </div>
  )
}
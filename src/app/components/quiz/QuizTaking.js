'use client'
import styles from '../../student/page.module.css'

// this quiztaking component have:
// active quiz view — shows current question, options, timer, dots nav.
// and also have these props:
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
  const currentQuestion = quiz.questions[currentQuestionIndex]
  if (!currentQuestion) return (
    <div className={styles.container}>
      <div className={styles.alertError}>Error loading question.</div>
    </div>
  )

  const questionId = currentQuestion._id || currentQuestion.id || currentQuestionIndex.toString()
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const answeredCount = Object.keys(answers).length

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
              {quiz.difficulty}
            </span>
            <span className={styles.metaTag}>{quiz.category}</span>
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
                <div className={`${styles.optionRadio} ${isSelected ? styles.optionRadioSelected : ''}`} />
                <span className={`${styles.optionText} ${isSelected ? styles.optionTextSelected : ''}`}>
                  {option}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className={styles.quizNav}>
        <button
          className={styles.btnNav}
          onClick={onPrev}
          disabled={currentQuestionIndex === 0 || isSubmitting || timeExpired}>
          ← Previous
        </button>

        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          {answeredCount}/{quiz.questions.length} answered
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
    </div>
  )
}
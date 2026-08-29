'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import quizStyles from '../student/page.module.css'

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F']

// Public quiz play page with guest entry, keyboard shortcuts,
// grade analytics, mistake-focused review, and account registration CTA.
export default function PlayPage() {

  // screen state
  const [screen, setScreen] = useState('entry')

  // guest info
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [entryError, setEntryError] = useState('')
  const [isCheckingPasscode, setIsCheckingPasscode] = useState(false)
  const [quizSearch, setQuizSearch] = useState('')

  // public quizzes
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [quizzesLoading, setQuizzesLoading] = useState(true)

  // active quiz
  const [quiz, setQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [startTime, setStartTime] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerInterval, setTimerInterval] = useState(null)
  const [timeExpired, setTimeExpired] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // results
  const [score, setScore] = useState(0)
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)
  const [reviewData, setReviewData] = useState([])
  const [explanations, setExplanations] = useState([])
  const [isFetchingExplanations, setIsFetchingExplanations] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all')

  // Keeps a live copy of answers for interval submit callback
  const answersRef = useRef({})
  useEffect(() => { answersRef.current = answers }, [answers])

  // fetch quizzes on mount
  useEffect(() => {
    fetchPublicQuizzes()
    return () => { if (timerInterval) clearInterval(timerInterval) }
  }, [timerInterval])

  const fetchPublicQuizzes = async () => {
    try {
      const res = await fetch('/api/public-quizzes')
      const data = await res.json()
      if (res.ok) setQuizzes(data.quizzes || [])
    } catch (e) {
      console.error('Failed to fetch public quizzes:', e)
    }
    setQuizzesLoading(false)
  }

  // ── Keyboard Shortcuts (1-4 / A-D and Arrow Keys) in Quiz Mode ──
  useEffect(() => {
    if (screen !== 'quiz' || !quiz || isSubmitting || timeExpired) return

    const currentQuestion = quiz.questions[currentQuestionIndex]
    if (!currentQuestion) return

    const questionId = currentQuestion._id || currentQuestion.id || currentQuestionIndex.toString()

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return

      const key = e.key.toLowerCase()

      if (['1', '2', '3', '4'].includes(key)) {
        const optIdx = parseInt(key, 10) - 1
        if (optIdx < (currentQuestion.options?.length || 0)) {
          handleAnswer(questionId, optIdx)
        }
      } else if (['a', 'b', 'c', 'd'].includes(key)) {
        const optIdx = key.charCodeAt(0) - 97
        if (optIdx < (currentQuestion.options?.length || 0)) {
          handleAnswer(questionId, optIdx)
        }
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        if (currentQuestionIndex < quiz.questions.length - 1) {
          setCurrentQuestionIndex(p => p + 1)
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(p => p - 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screen, quiz, currentQuestionIndex, isSubmitting, timeExpired])

  // start (async — verifies passcode against server)
  const handleStart = async () => {
    setEntryError('')

    if (!guestName.trim()) { setEntryError('Please enter your full name'); return }
    if (!guestEmail.trim() || !guestEmail.includes('@')) { setEntryError('Please enter a valid email address'); return }
    if (!selectedQuizId) { setEntryError('Please select a quiz to play'); return }

    const selectedQuiz = quizzes.find(q => q._id === selectedQuizId)
    if (!selectedQuiz) { setEntryError('Quiz not found'); return }

    if (selectedQuiz.hasPasscode) {
      setIsCheckingPasscode(true)
      try {
        const res = await fetch('/api/public-quizzes/verify-passcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: selectedQuiz._id, passcode })
        })
        const data = await res.json()
        setIsCheckingPasscode(false)

        if (!res.ok || !data.valid) {
          setEntryError('Incorrect passcode for this quiz')
          return
        }
      } catch (e) {
        setIsCheckingPasscode(false)
        setEntryError('Could not verify passcode. Please try again.')
        return
      }
    }

    startQuiz(selectedQuiz)
  }

  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const startQuiz = (selectedQuiz) => {
    const shuffledQuestions = shuffleArray(selectedQuiz.questions).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }))

    const quizWithShuffled = { ...selectedQuiz, questions: shuffledQuestions }
    setQuiz(quizWithShuffled)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setStartTime(new Date())
    setTimeExpired(false)
    setIsSubmitting(false)
    setExplanations([])
    setIsFetchingExplanations(false)
    setReviewData([])
    setScreen('quiz')

    if (selectedQuiz.timerEnabled && selectedQuiz.timeLimit > 0) {
      const totalSeconds = selectedQuiz.timeLimit * 60
      setTimeLeft(totalSeconds)
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setTimeExpired(true)
            submitQuiz(quizWithShuffled, answersRef.current, true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      setTimerInterval(interval)
    } else {
      setTimeLeft(null)
    }
  }

  const handleAnswer = (questionId, optionIndex) => {
    if (isSubmitting || timeExpired) return
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleExit = () => {
    if (!window.confirm('Exit this quiz? Your progress will be lost.')) return
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    setScreen('entry')
    setQuiz(null)
    setAnswers({})
    setSelectedQuizId('')
    setPasscode('')
  }

  const submitQuiz = async (quizData, answersData, expired = false) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }

    const dataQuiz = quizData || quiz
    const dataAnswers = answersData || {}

    const taken = startTime ? Math.floor((new Date() - startTime) / 1000) : 0
    setTimeTaken(taken)

    const payloadAnswers = dataQuiz.questions.map((q, i) => {
      const questionId = q._id || q.id || i.toString()
      const selectedIndex = dataAnswers[questionId]
      const selectedOptionText = selectedIndex !== undefined ? q.options[selectedIndex] : null
      return { questionId, selectedOptionText }
    })

    let gradedResult = null
    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: dataQuiz._id,
          answers: payloadAnswers,
          timeTaken: taken,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        gradedResult = data.result
      }
    } catch (e) {
      console.error('Failed to save result:', e)
    }

    if (gradedResult) {
      setScore(gradedResult.score)
      setCorrectAnswersCount(gradedResult.correctAnswers)
      setReviewData(gradedResult.review || [])
      const wrongCount = (dataQuiz.questions.length || 0) - (gradedResult.correctAnswers || 0)
      setReviewFilter(wrongCount > 0 ? 'mistakes' : 'all')
      if (!expired) fetchExplanations(gradedResult.review || [])
    } else {
      setScore(0)
      setCorrectAnswersCount(0)
      setReviewData([])
    }

    setScreen('results')
    setIsSubmitting(false)
  }

  const fetchExplanations = async (review) => {
    const wrongQuestions = review
      .filter(r => !r.isCorrect && r.selectedOptionIndex !== -1)
      .map(r => ({
        questionId: r.questionId,
        question: r.question,
        options: r.options,
        correctAnswer: r.correctAnswer,
        studentAnswer: r.selectedOptionIndex
      }))

    if (wrongQuestions.length === 0) return

    setIsFetchingExplanations(true)
    try {
      const res = await fetch('/api/explain-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wrongQuestions })
      })
      const data = await res.json()

      if (res.ok && Array.isArray(data.explanations)) {
        const mapped = data.explanations.map((ex, idx) => ({
          questionId: wrongQuestions[idx]?.questionId,
          explanation: ex.explanation || ex.answerExplanation || 'Explanation unavailable.'
        }))
        setExplanations(mapped)
      }
    } catch (e) {
      console.error('Failed to fetch explanations:', e)
    }
    setIsFetchingExplanations(false)
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const getScoreEmoji = (s) => s >= 90 ? '🏆' : s >= 80 ? '⭐' : s >= 60 ? '👍' : s >= 40 ? '📚' : '💪'

  const getGradeInfo = (s) => {
    if (s >= 90) return { grade: 'Grade A+', label: 'Outstanding Mastery' }
    if (s >= 80) return { grade: 'Grade A', label: 'Excellent Performance' }
    if (s >= 60) return { grade: 'Grade B', label: 'Good Understanding' }
    if (s >= 40) return { grade: 'Grade C', label: 'Passing Score' }
    return { grade: 'Needs Review', label: 'Keep Practicing' }
  }

  const getDifficultyTag = (d) =>
    d === 'easy' ? quizStyles.metaTagGreen :
    d === 'hard' ? quizStyles.metaTagRed :
    quizStyles.metaTagAmber

  // ────────────────────────────────────────────────────────
  // ENTRY SCREEN
  // ────────────────────────────────────────────────────────
  if (screen === 'entry') {
    const filteredQuizzes = quizzes.filter(q =>
      q.title?.toLowerCase().includes(quizSearch.toLowerCase()) ||
      q.category?.toLowerCase().includes(quizSearch.toLowerCase())
    )

    return (
      <div className={styles.page}>
        <div className={styles.entryCard}>

          <div className={styles.entryHeader}>
            <div className={styles.entryLogo}>🎓</div>
            <h1 className={styles.entryTitle}>IntelliQuiz</h1>
            <p className={styles.entrySubtitle}>Play a public quiz — no account required</p>
          </div>

          <div className={styles.entryBody}>

            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Enter your full name" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                className={styles.input}
                type="email"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="Enter your email" />
            </div>

            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className={styles.label} style={{ margin: 0 }}>Select a Quiz</label>
                {quizzes.length > 3 && (
                  <input
                    type="text"
                    placeholder="Filter quizzes..."
                    value={quizSearch}
                    onChange={e => setQuizSearch(e.target.value)}
                    className={styles.miniSearchInput}
                  />
                )}
              </div>

              {quizzesLoading ? (
                <div className={styles.loadingText}>Loading quizzes...</div>
              ) : quizzes.length === 0 ? (
                <div className={styles.noQuizzes}>No public quizzes available right now.</div>
              ) : (
                <div className={styles.quizPickerList}>
                  {filteredQuizzes.map(q => (
                    <div
                      key={q._id}
                      className={`${styles.quizPickerItem} ${selectedQuizId === q._id ? styles.quizPickerSelected : ''}`}
                      onClick={() => setSelectedQuizId(q._id)}>
                      <div className={styles.quizPickerRadio}>
                        {selectedQuizId === q._id && <div className={styles.quizPickerRadioDot} />}
                      </div>
                      <div className={styles.quizPickerInfo}>
                        <div className={styles.quizPickerTitle}>{q.title}</div>
                        <div className={styles.quizPickerMeta}>
                          <span className={`${quizStyles.metaTag} ${getDifficultyTag(q.difficulty)}`}>
                            {q.difficulty ? q.difficulty.toUpperCase() : 'MEDIUM'}
                          </span>
                          <span>📁 {q.category || 'General'}</span>
                          <span>📝 {q.questions?.length || 0} Qs</span>
                          <span>{q.timerEnabled ? `⏰ ${q.timeLimit} min` : '∞ No timer'}</span>
                          {q.hasPasscode && <span className={styles.passcodeTag}>🔒 Passcode Required</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedQuizId && quizzes.find(q => q._id === selectedQuizId)?.hasPasscode && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Quiz Passcode</label>
                <input
                  className={styles.input}
                  type="text"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="Enter access passcode" />
              </div>
            )}

            {entryError && (
              <div className={styles.errorAlert}>{entryError}</div>
            )}

            <button
              className={styles.startBtn}
              onClick={handleStart}
              disabled={quizzesLoading || quizzes.length === 0 || isCheckingPasscode}>
              {isCheckingPasscode ? 'Verifying Passcode…' : 'Start Quiz →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link href="/" style={{ color: 'var(--primary-400)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                ← Return to Student & Admin Portal
              </Link>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────
  // QUIZ SCREEN
  // ────────────────────────────────────────────────────────
  if (screen === 'quiz' && quiz) {
    const currentQuestion = quiz.questions[currentQuestionIndex]
    const questionId = currentQuestion._id || currentQuestion.id || currentQuestionIndex.toString()
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
    const answeredCount = Object.keys(answers).length
    const remainingCount = (quiz.questions.length || 0) - answeredCount

    return (
      <div
        className={quizStyles.container}
        onCopy={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className={quizStyles.nav}>
          <h1 className={quizStyles.navTitle}>{quiz.title}</h1>
          <div className={quizStyles.navRight}>
            {quiz.timerEnabled && timeLeft !== null && !timeExpired && (
              <span className={timeLeft < 60 ? quizStyles.timerWarning : quizStyles.timerNormal}>
                ⏰ {formatTime(timeLeft)}
              </span>
            )}
            <span className={quizStyles.navUser}>{guestName} (Guest)</span>
            <button className={quizStyles.navBtnDanger} onClick={handleExit}>
              Exit Quiz
            </button>
          </div>
        </div>

        {quiz.timerEnabled && timeLeft !== null && timeLeft < 60 && !timeExpired && (
          <div className={quizStyles.alertWarning}>⚠️ Less than a minute remaining!</div>
        )}
        {timeExpired && (
          <div className={quizStyles.alertExpired}>⏰ Time expired! Submitting your quiz...</div>
        )}

        <div className={quizStyles.progressBar}>
          <div className={quizStyles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={quizStyles.dotsNav}>
          {quiz.questions.map((_, i) => {
            const qid = quiz.questions[i]._id || quiz.questions[i].id || i.toString()
            return (
              <button
                key={i}
                className={`${quizStyles.dot} ${i === currentQuestionIndex ? quizStyles.dotCurrent : ''} ${answers[qid] !== undefined && i !== currentQuestionIndex ? quizStyles.dotAnswered : ''}`}
                onClick={() => !isSubmitting && !timeExpired && setCurrentQuestionIndex(i)}>
                {i + 1}
              </button>
            )
          })}
        </div>

        <div className={quizStyles.questionCard}>
          <div className={quizStyles.questionMeta}>
            <span className={quizStyles.questionNum}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <div className={quizStyles.questionTags}>
              <span className={`${quizStyles.metaTag} ${getDifficultyTag(quiz.difficulty)}`}>
                {quiz.difficulty ? quiz.difficulty.toUpperCase() : 'MEDIUM'}
              </span>
              <span className={quizStyles.metaTag}>{quiz.category || 'General'}</span>
            </div>
          </div>

          <div className={quizStyles.questionText}>{currentQuestion.question}</div>

          <div className={quizStyles.optionsList}>
            {currentQuestion.options?.map((option, i) => {
              const isSelected = answers[questionId] === i
              return (
                <div
                  key={i}
                  className={`${quizStyles.optionItem} ${isSelected ? quizStyles.optionSelected : ''} ${isSubmitting || timeExpired ? quizStyles.optionDisabled : ''}`}
                  onClick={() => handleAnswer(questionId, i)}>
                  <span className={quizStyles.optionLetterBadge}>
                    {OPTION_KEYS[i] || i + 1}
                  </span>
                  <div className={`${quizStyles.optionRadio} ${isSelected ? quizStyles.optionRadioSelected : ''}`} />
                  <span className={`${quizStyles.optionText} ${isSelected ? quizStyles.optionTextSelected : ''}`}>
                    {option}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className={quizStyles.quizNav}>
          <button
            className={quizStyles.btnNav}
            onClick={() => setCurrentQuestionIndex(p => p - 1)}
            disabled={currentQuestionIndex === 0 || isSubmitting || timeExpired}>
            ← Previous
          </button>

          <span className={quizStyles.answeredStatusText}>
            {answeredCount}/{quiz.questions.length} answered {remainingCount > 0 && `(${remainingCount} remaining)`}
          </span>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button
              className={quizStyles.btnNav}
              onClick={() => setCurrentQuestionIndex(p => p + 1)}
              disabled={isSubmitting || timeExpired}>
              Next →
            </button>
          ) : (
            <button
              className={quizStyles.btnSubmit}
              onClick={() => submitQuiz(quiz, answers, false)}
              disabled={isSubmitting || timeExpired}>
              {isSubmitting ? '⏳ Submitting...' : '✓ Submit Quiz'}
            </button>
          )}
        </div>

        <div className={quizStyles.keyboardHintPill}>
          <span>⌨️ Shortcuts: Press <strong>1–4</strong> (or <strong>A–D</strong>) to select • <strong>← / →</strong> to navigate</span>
        </div>

      </div>
    )
  }

  // ────────────────────────────────────────────────────────
  // RESULTS SCREEN
  // ────────────────────────────────────────────────────────
  if (screen === 'results' && quiz) {
    const totalQuestions = quiz.questions?.length || 0
    const wrongAnswersCount = totalQuestions - correctAnswersCount
    const gradeInfo = getGradeInfo(score)
    const avgTimePerQuestion = timeTaken > 0 && totalQuestions > 0 ? Math.round(timeTaken / totalQuestions) : null

    const filteredReview = reviewData.filter(r => {
      if (reviewFilter === 'mistakes') return !r.isCorrect
      if (reviewFilter === 'correct') return r.isCorrect
      return true
    })

    return (
      <div className={quizStyles.container}>

        <div className={quizStyles.nav}>
          <h1 className={quizStyles.navTitle}>Quiz Results</h1>
          <div className={quizStyles.navRight}>
            <span className={quizStyles.navUser}>{guestName} (Guest)</span>
            <Link href="/" className={quizStyles.navBtn}>Home</Link>
          </div>
        </div>

        <div className={quizStyles.scoreCard}>
          <div className={quizStyles.scoreEmoji}>{timeExpired ? '⏰' : getScoreEmoji(score)}</div>
          <div className={quizStyles.scoreTitle}>
            {timeExpired ? 'Time Expired!' : 'Quiz Completed!'}
          </div>
          <div className={quizStyles.scoreQuiz}>{quiz.title}</div>
          <div className={quizStyles.scoreBig}>{score}%</div>

          <div className={quizStyles.gradeBadge}>
            <span>{gradeInfo.grade}</span>
            <span className={quizStyles.gradeLabel}>• {gradeInfo.label}</span>
          </div>

          <div className={quizStyles.scoreStats}>
            <div className={quizStyles.scoreStat}>
              <span className={quizStyles.scoreStatVal}>{correctAnswersCount}</span>
              <span className={quizStyles.scoreStatLbl}>Correct</span>
            </div>
            <div className={quizStyles.scoreStat}>
              <span className={quizStyles.scoreStatVal}>{wrongAnswersCount}</span>
              <span className={quizStyles.scoreStatLbl}>Wrong</span>
            </div>
            <div className={quizStyles.scoreStat}>
              <span className={quizStyles.scoreStatVal}>{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</span>
              <span className={quizStyles.scoreStatLbl}>Total Time</span>
            </div>
            {avgTimePerQuestion && (
              <div className={quizStyles.scoreStat}>
                <span className={quizStyles.scoreStatVal}>~{avgTimePerQuestion}s</span>
                <span className={quizStyles.scoreStatLbl}>Avg / Q</span>
              </div>
            )}
          </div>

          <div className={quizStyles.scoreActions}>
            <button
              className={quizStyles.btnPrimary}
              onClick={() => { setScreen('entry'); setSelectedQuizId(''); setAnswers({}); setPasscode('') }}>
              Play Another Quiz
            </button>
            <Link href="/" className={quizStyles.btnOutline}>
              Go to Home Page
            </Link>
          </div>
        </div>

        <div className={styles.promoCard}>
          <div className={styles.promoContent}>
            <div className={styles.promoIcon}>🎓</div>
            <div>
              <h4 className={styles.promoTitle}>Enjoyed this quiz? Join IntelliQuiz as a Student!</h4>
              <p className={styles.promoDesc}>
                Create a free student account to take full quizzes, track your progress over time, and build your permanent score history!
              </p>
            </div>
          </div>
          <Link href="/" className={styles.promoBtn}>
            Create Free Account →
          </Link>
        </div>

        {!timeExpired && (
          <>
            <div className={quizStyles.reviewHeaderRow}>
              <h3 className={quizStyles.reviewTitle}>Review Questions & Answers</h3>

              <div className={quizStyles.reviewFilterPills}>
                <button
                  type="button"
                  className={`${quizStyles.reviewPill} ${reviewFilter === 'all' ? quizStyles.reviewPillActive : ''}`}
                  onClick={() => setReviewFilter('all')}>
                  📋 All ({totalQuestions})
                </button>
                <button
                  type="button"
                  className={`${quizStyles.reviewPill} ${reviewFilter === 'mistakes' ? quizStyles.reviewPillActive : ''}`}
                  onClick={() => setReviewFilter('mistakes')}>
                  ❌ Mistakes ({wrongAnswersCount})
                </button>
                <button
                  type="button"
                  className={`${quizStyles.reviewPill} ${reviewFilter === 'correct' ? quizStyles.reviewPillActive : ''}`}
                  onClick={() => setReviewFilter('correct')}>
                  ✅ Correct ({correctAnswersCount})
                </button>
              </div>
            </div>

            {isFetchingExplanations && (
              <div className={quizStyles.alertWarning} style={{ textAlign: 'center', marginBottom: 16 }}>
                ✨ Please wait, generating AI explanations for your wrong answers...
              </div>
            )}

            {filteredReview.length === 0 ? (
              <div className={quizStyles.emptyState} style={{ padding: '36px 20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {reviewFilter === 'mistakes'
                    ? 'Perfect score! You answered all questions correctly.'
                    : 'No questions in this filter.'}
                </p>
              </div>
            ) : (
              filteredReview.map((r, i) => {
                const explanationObj = explanations.find(e => e.questionId === r.questionId)
                return (
                  <div key={r.questionId || i} className={quizStyles.reviewCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className={quizStyles.questionNum}>Question {i + 1}</span>
                      <span className={`${quizStyles.metaTag} ${r.isCorrect ? quizStyles.metaTagGreen : quizStyles.metaTagRed}`}>
                        {r.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    <div className={quizStyles.reviewQuestion}>{r.question}</div>

                    <div className={quizStyles.optionsList}>
                      {r.options?.map((opt, j) => (
                        <div
                          key={j}
                          className={`${quizStyles.reviewOption} ${
                            j === r.correctAnswer ? quizStyles.reviewCorrect :
                            j === r.selectedOptionIndex && !r.isCorrect ? quizStyles.reviewWrong :
                            quizStyles.reviewNeutral
                          }`}>
                          <span>
                            {j === r.correctAnswer ? '✓' :
                             j === r.selectedOptionIndex && !r.isCorrect ? '✗' : '○'} {opt}
                          </span>
                          {j === r.correctAnswer && <span style={{ fontWeight: 800, fontSize: '12px' }}>(Correct Answer)</span>}
                          {j === r.selectedOptionIndex && j !== r.correctAnswer && <span style={{ fontWeight: 800, fontSize: '12px' }}>(Your Answer)</span>}
                        </div>
                      ))}
                    </div>

                    {r.selectedOptionIndex === -1 && (
                      <div className={quizStyles.reviewUnanswered}>⚠️ Not answered</div>
                    )}

                    {!r.isCorrect && r.selectedOptionIndex !== -1 && (
                      <div className={quizStyles.aiExplanation}>
                        <span className={quizStyles.aiExplanationLabel}>✨ AI Concept Explanation</span>
                        {explanationObj ? (
                          <p className={quizStyles.aiExplanationText}>
                            {explanationObj.explanation}
                          </p>
                        ) : isFetchingExplanations ? (
                          <p className={quizStyles.aiExplanationText} style={{ opacity: 0.5 }}>
                            Loading explanation...
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </>
        )}

        {timeExpired && (
          <div className={quizStyles.alertExpired}>
            {"⏰ Time ran out — try again to complete all questions within the time limit!"}
          </div>
        )}
      </div>
    )
  }

  return null
}
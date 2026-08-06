
'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'
import quizStyles from '../student/page.module.css'

// public quiz play page
export default function PlayPage() {

  // screen state
  const [screen, setScreen] = useState('entry')

  // guest info
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [entryError, setEntryError] = useState('')
  const [isCheckingPasscode, setIsCheckingPasscode] = useState(false)

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

  // results (populated from the server's graded response, not calculated locally)
  const [score, setScore] = useState(0)
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)
  const [reviewData, setReviewData] = useState([])
  const [explanations, setExplanations] = useState([])
  const [isFetchingExplanations, setIsFetchingExplanations] = useState(false)

  // Keeps a live copy of `answers` so the timer's setInterval callback
  // (which closes over stale state) can still submit whatever the user
  // had actually selected when time runs out.
  const answersRef = useRef({})
  useEffect(() => { answersRef.current = answers }, [answers])

  // fetch quizzes on mount
  useEffect(() => {
    fetchPublicQuizzes()
    return () => { if (timerInterval) clearInterval(timerInterval) }
  }, [])

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

  // start (async — verifies passcode against the server; the real
  // passcode is never sent to the browser)
  const handleStart = async () => {
    setEntryError('')

    if (!guestName.trim()) { setEntryError('Please enter your name'); return }
    if (!guestEmail.trim() || !guestEmail.includes('@')) { setEntryError('Please enter a valid email'); return }
    if (!selectedQuizId) { setEntryError('Please select a quiz'); return }

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
          setEntryError('Incorrect passcode')
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

  // start quiz — quiz.questions no longer contains correctAnswer, so we
  // only shuffle option order; there's nothing sensitive to recompute.
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

  // exit back to the entry screen mid-quiz (guest-friendly equivalent of
  // the student page's "Exit Quiz" button — no auth session to worry about)
  const handleExit = () => {
    if (!window.confirm('Exit this quiz? Your progress will be lost.')) return
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    setScreen('entry')
    setQuiz(null)
    setAnswers({})
    setSelectedQuizId('')
    setPasscode('')
  }

  // submit — sends option TEXT (not index, since shuffle order is only
  // known client-side) and lets the server grade it against the real quiz.
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
        // IMPORTANT: don't trust the questionId Gemini echoes back — LLMs
        // often can't reproduce long random IDs exactly, which silently
        // breaks the lookup later. Match by response position instead,
        // and re-attach OUR OWN known questionId from wrongQuestions.
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
  const getScoreEmoji = (s) => s >= 80 ? '🏆' : s >= 60 ? '⭐' : s >= 40 ? '👍' : '📚'
  const getDifficultyColor = (d) => d === 'easy' ? '#6ee7b7' : d === 'hard' ? '#fca5a5' : '#fcd34d'
  const getDifficultyTag = (d) =>
    d === 'easy' ? quizStyles.metaTagGreen :
    d === 'hard' ? quizStyles.metaTagRed :
    quizStyles.metaTagAmber

  // ────────────────────────────────────────────────────────
  // ENTRY SCREEN — unchanged local styling
  // ────────────────────────────────────────────────────────
  if (screen === 'entry') {
    return (
      <div className={styles.page}>
        <div className={styles.entryCard}>

          <div className={styles.entryHeader}>
            <div className={styles.entryLogo}>🎓</div>
            <h1 className={styles.entryTitle}>IntelliQuiz</h1>
            <p className={styles.entrySubtitle}>Play a quiz — no account needed</p>
          </div>

          <div className={styles.entryBody}>

            <div className={styles.formGroup}>
              <label className={styles.label}>Your Name</label>
              <input
                className={styles.input}
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Enter your full name" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="Enter your email" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Select Quiz</label>
              {quizzesLoading ? (
                <div className={styles.loadingText}>Loading quizzes...</div>
              ) : quizzes.length === 0 ? (
                <div className={styles.noQuizzes}>No public quizzes available right now.</div>
              ) : (
                <div className={styles.quizPickerList}>
                  {quizzes.map(q => (
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
                          <span style={{ color: getDifficultyColor(q.difficulty) }}>{q.difficulty}</span>
                          <span>•</span>
                          <span>{q.questions?.length || 0} questions</span>
                          <span>•</span>
                          <span>{q.timerEnabled ? `⏰ ${q.timeLimit} min` : '∞ No timer'}</span>
                          {q.hasPasscode && <span>🔒 Passcode required</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedQuizId && quizzes.find(q => q._id === selectedQuizId)?.hasPasscode && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Passcode</label>
                <input
                  className={styles.input}
                  type="text"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="Enter quiz passcode" />
              </div>
            )}

            {entryError && (
              <div className={styles.errorAlert}>{entryError}</div>
            )}

            <button
              className={styles.startBtn}
              onClick={handleStart}
              disabled={quizzesLoading || quizzes.length === 0 || isCheckingPasscode}>
              {isCheckingPasscode ? 'Checking passcode…' : 'Start Quiz →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────
  // QUIZ SCREEN — now styled with quizStyles (student/page.module.css),
  // same classes/structure as QuizTaking.js, for a guaranteed visual match
  // ────────────────────────────────────────────────────────
  if (screen === 'quiz' && quiz) {
    const currentQuestion = quiz.questions[currentQuestionIndex]
    const questionId = currentQuestion._id || currentQuestion.id || currentQuestionIndex.toString()
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
    const answeredCount = Object.keys(answers).length

    return (
      <div
        className={quizStyles.container}
        onCopy={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Nav */}
        <div className={quizStyles.nav}>
          <h1 className={quizStyles.navTitle}>{quiz.title}</h1>
          <div className={quizStyles.navRight}>
            {quiz.timerEnabled && timeLeft !== null && !timeExpired && (
              <span className={timeLeft < 60 ? quizStyles.timerWarning : quizStyles.timerNormal}>
                ⏰ {formatTime(timeLeft)}
              </span>
            )}
            <span className={quizStyles.navUser}>{guestName}</span>
            <button className={quizStyles.navBtnDanger} onClick={handleExit}>
              Exit Quiz
            </button>
          </div>
        </div>

        {/* Alerts */}
        {quiz.timerEnabled && timeLeft !== null && timeLeft < 60 && !timeExpired && (
          <div className={quizStyles.alertWarning}>⚠️ Less than a minute remaining!</div>
        )}
        {timeExpired && (
          <div className={quizStyles.alertExpired}>⏰ Time expired! Submitting your quiz...</div>
        )}

        {/* Progress bar */}
        <div className={quizStyles.progressBar}>
          <div className={quizStyles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Question dots */}
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

        {/* Question card */}
        <div className={quizStyles.questionCard}>
          <div className={quizStyles.questionMeta}>
            <span className={quizStyles.questionNum}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <div className={quizStyles.questionTags}>
              <span className={`${quizStyles.metaTag} ${getDifficultyTag(quiz.difficulty)}`}>
                {quiz.difficulty}
              </span>
              <span className={quizStyles.metaTag}>{quiz.category}</span>
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
                  <div className={`${quizStyles.optionRadio} ${isSelected ? quizStyles.optionRadioSelected : ''}`} />
                  <span className={`${quizStyles.optionText} ${isSelected ? quizStyles.optionTextSelected : ''}`}>
                    {option}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className={quizStyles.quizNav}>
          <button
            className={quizStyles.btnNav}
            onClick={() => setCurrentQuestionIndex(p => p - 1)}
            disabled={currentQuestionIndex === 0 || isSubmitting || timeExpired}>
            ← Previous
          </button>

          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            {answeredCount}/{quiz.questions.length} answered
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
      </div>
    )
  }

  // ────────────────────────────────────────────────────────
  // RESULTS SCREEN — also styled with quizStyles, matching QuizResults.js,
  // with AI explanations attached directly under each wrong answer
  // ────────────────────────────────────────────────────────
  if (screen === 'results' && quiz) {
    return (
      <div className={quizStyles.container}>

        {/* Nav */}
        <div className={quizStyles.nav}>
          <h1 className={quizStyles.navTitle}>Quiz Results</h1>
          <div className={quizStyles.navRight}>
            <span className={quizStyles.navUser}>{guestName}</span>
          </div>
        </div>

        {/* Score card */}
        <div className={quizStyles.scoreCard}>
          <div className={quizStyles.scoreEmoji}>{timeExpired ? '⏰' : getScoreEmoji(score)}</div>
          <div className={quizStyles.scoreTitle}>
            {timeExpired ? 'Time Expired!' : 'Quiz Completed!'}
          </div>
          <div className={quizStyles.scoreQuiz}>{quiz.title}</div>
          <div className={quizStyles.scoreBig}>{score}%</div>
          <div className={quizStyles.scoreStats}>
            <div className={quizStyles.scoreStat}>
              <span className={quizStyles.scoreStatVal}>{correctAnswersCount}</span>
              <span className={quizStyles.scoreStatLbl}>Correct</span>
            </div>
            <div className={quizStyles.scoreStat}>
              <span className={quizStyles.scoreStatVal}>{quiz.questions.length - correctAnswersCount}</span>
              <span className={quizStyles.scoreStatLbl}>Wrong</span>
            </div>
            <div className={quizStyles.scoreStat}>
              <span className={quizStyles.scoreStatVal}>{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</span>
              <span className={quizStyles.scoreStatLbl}>Time Taken</span>
            </div>
          </div>
          <div className={quizStyles.scoreActions}>
            <button
              className={quizStyles.btnPrimary}
              onClick={() => { setScreen('entry'); setSelectedQuizId(''); setAnswers({}); setPasscode('') }}>
              Play Again
            </button>
          </div>
        </div>

        {/* Review answers */}
        {!timeExpired && (
          <>
            <div className={quizStyles.reviewTitle}>Review Answers</div>

            {isFetchingExplanations && (
              <div className={quizStyles.alertWarning} style={{ textAlign: 'center', marginBottom: 16 }}>
                ✨ Please wait, we are generating explanations for your wrong answers...
              </div>
            )}

            {reviewData.map((r, i) => {
              const explanationObj = explanations.find(e => e.questionId === r.questionId)
              return (
                <div key={r.questionId} className={quizStyles.reviewCard}>
                  <div className={quizStyles.reviewQuestion}>Q{i + 1}: {r.question}</div>

                  {r.options?.map((opt, j) => (
                    <div
                      key={j}
                      className={`${quizStyles.reviewOption} ${
                        j === r.correctAnswer ? quizStyles.reviewCorrect :
                        j === r.selectedOptionIndex && !r.isCorrect ? quizStyles.reviewWrong :
                        quizStyles.reviewNeutral
                      }`}>
                      {j === r.correctAnswer ? '✓' :
                       j === r.selectedOptionIndex && !r.isCorrect ? '✗' : '○'} {opt}
                      {j === r.correctAnswer && ' (Correct)'}
                      {j === r.selectedOptionIndex && j !== r.correctAnswer && ' (Your answer)'}
                    </div>
                  ))}

                  {r.selectedOptionIndex === -1 && (
                    <div className={quizStyles.reviewUnanswered}>⚠️ Not answered</div>
                  )}

                  {/* AI explanation — only on wrong answers */}
                  {!r.isCorrect && r.selectedOptionIndex !== -1 && (
                    <div className={quizStyles.aiExplanation}>
                      <span className={quizStyles.aiExplanationLabel}>✨ Explanation</span>
                      {explanationObj ? (
                        <p className={quizStyles.aiExplanationText}>
                          {explanationObj.explanation}
                        </p>
                      ) : isFetchingExplanations ? (
                        <p className={quizStyles.aiExplanationText} style={{ opacity: 0.5 }}>
                          Loading...
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {timeExpired && (
          <div className={quizStyles.alertExpired}>
            {"⏰ Time ran out — here's how you did on the questions you answered."}
          </div>
        )}
      </div>
    )
  }

  return null
}
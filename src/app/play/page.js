'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.css'

// public quiz play page
export default function PlayPage() {

  // screen state
  const [screen, setScreen] = useState('entry')

  // guest info
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [entryError, setEntryError] = useState('')

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
  const [explanations, setExplanations] = useState([])
  const [isFetchingExplanations, setIsFetchingExplanations] = useState(false)

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

  // start
  const handleStart = () => {
    setEntryError('')

    if (!guestName.trim()) { setEntryError('Please enter your name'); return }
    if (!guestEmail.trim() || !guestEmail.includes('@')) { setEntryError('Please enter a valid email'); return }
    if (!selectedQuizId) { setEntryError('Please select a quiz'); return }

    const selectedQuiz = quizzes.find(q => q._id === selectedQuizId)
    if (!selectedQuiz) { setEntryError('Quiz not found'); return }

    // Check passcode if quiz requires one
    if (selectedQuiz.passcode && selectedQuiz.passcode.trim() !== '') {
      if (passcode.trim() !== selectedQuiz.passcode.trim()) {
        setEntryError('Incorrect passcode'); return
      }
    }

    startQuiz(selectedQuiz)
  }

  // shuffle
  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5)

  // start quiz
  const startQuiz = (selectedQuiz) => {
    // Shuffle questions and options
    const shuffledQuestions = shuffleArray(selectedQuiz.questions).map(q => {
      const correctAnswerText = q.options[q.correctAnswer]
      const shuffledOptions = shuffleArray(q.options)
      const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText)
      return { ...q, options: shuffledOptions, correctAnswer: newCorrectIndex }
    })

    const quizWithShuffled = { ...selectedQuiz, questions: shuffledQuestions }
    setQuiz(quizWithShuffled)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setStartTime(new Date())
    setTimeExpired(false)
    setIsSubmitting(false)
    setExplanations([])
    setIsFetchingExplanations(false)
    setScreen('quiz')

    // timer
    if (selectedQuiz.timerEnabled && selectedQuiz.timeLimit > 0) {
      const totalSeconds = selectedQuiz.timeLimit * 60
      setTimeLeft(totalSeconds)
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setTimeExpired(true)
            submitQuiz(quizWithShuffled, {}, true)
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

  // answer selection
  const handleAnswer = (questionId, optionIndex) => {
    if (isSubmitting || timeExpired) return
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  // calculate score
  const calculateScore = (quizData, answersData) => {
    let correct = 0
    const processedAnswers = quizData.questions.map((q, i) => {
      const questionId = q._id || q.id || i.toString()
      const userAnswer = answersData[questionId]
      const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer
      if (isCorrect) correct++
      return { questionId, selectedOption: userAnswer ?? -1, isCorrect }
    })
    const finalScore = Math.round((correct / quizData.questions.length) * 100)
    return { correct, finalScore, processedAnswers }
  }

  // submit
  const submitQuiz = async (quizData, answersData, expired = false) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }

    const taken = startTime ? Math.floor((new Date() - startTime) / 1000) : 0
    setTimeTaken(taken)

    let finalScore = 0
    let correct = 0
    let processedAnswers = []

    if (!expired) {
      const result = calculateScore(quizData || quiz, answersData || answers)
      finalScore = result.finalScore
      correct = result.correct
      processedAnswers = result.processedAnswers
    } else {
      // expired
      processedAnswers = (quizData || quiz).questions.map((q, i) => ({
        questionId: q._id || q.id || i.toString(),
        selectedOption: -1,
        isCorrect: false
      }))
    }

    setScore(finalScore)
    setCorrectAnswersCount(correct)

    // save result
    try {
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: (quizData || quiz)._id,
          answers: processedAnswers,
          score: finalScore,
          totalQuestions: (quizData || quiz).questions.length,
          correctAnswers: correct,
          timeTaken: taken,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim()
        })
      })
    } catch (e) {
      console.error('Failed to save result:', e)
    }

    if (!expired) {
      fetchExplanations(processedAnswers)
    }

    setScreen('results')
    setIsSubmitting(false)
  }

  const fetchExplanations = async (processedAnswers) => {
    if (!quiz?.questions) return

    const wrongQuestions = processedAnswers
      .filter(a => !a.isCorrect && a.selectedOption !== -1)
      .map(a => {
        const question = quiz.questions.find(
          q => (q._id || q.id) === a.questionId || quiz.questions.indexOf(q).toString() === a.questionId
        )
        if (!question) return null
        return {
          questionId: a.questionId,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          studentAnswer: a.selectedOption
        }
      })
      .filter(Boolean)

    if (wrongQuestions.length === 0) return

    setIsFetchingExplanations(true)
    try {
      const res = await fetch('/api/explain-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wrongQuestions })
      })
      const data = await res.json()
      if (res.ok && data.explanations) setExplanations(data.explanations)
    } catch (e) {
      console.error('Failed to fetch explanations:', e)
    }
    setIsFetchingExplanations(false)
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const getScoreEmoji = (s) => s >= 80 ? '🏆' : s >= 60 ? '⭐' : s >= 40 ? '👍' : '📚'
  const getDifficultyColor = (d) => d === 'easy' ? '#6ee7b7' : d === 'hard' ? '#fca5a5' : '#fcd34d'

  // entry screen
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
                          {q.passcode && <span>🔒 Passcode required</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedQuizId && quizzes.find(q => q._id === selectedQuizId)?.passcode && (
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
              disabled={quizzesLoading || quizzes.length === 0}>
              Start Quiz →
            </button>
          </div>
        </div>
      </div>
    )
  }
  // quiz screen
  if (screen === 'quiz' && quiz) {
    const currentQuestion = quiz.questions[currentQuestionIndex]
    const questionId = currentQuestion._id || currentQuestion.id || currentQuestionIndex.toString()
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
    const answeredCount = Object.keys(answers).length

    return (
      <div className={styles.page}>
        <div className={styles.quizWrapper}>

          <div className={styles.quizNav}>
            <div className={styles.quizNavTitle}>{quiz.title}</div>
            <div className={styles.quizNavRight}>
              {quiz.timerEnabled && timeLeft !== null && !timeExpired && (
                <span className={timeLeft < 60 ? styles.timerWarn : styles.timerNormal}>
                  ⏰ {formatTime(timeLeft)}
                </span>
              )}
              <span className={styles.guestTag}>{guestName}</span>
            </div>
          </div>

          {timeExpired && (
            <div className={styles.alertExpired}>⏰ Time expired! Submitting your quiz...</div>
          )}

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          <div className={styles.dotsRow}>
            {quiz.questions.map((_, i) => {
              const qid = quiz.questions[i]._id || quiz.questions[i].id || i.toString()
              return (
                <button
                  key={i}
                  className={`${styles.dot} ${i === currentQuestionIndex ? styles.dotActive : ''} ${answers[qid] !== undefined && i !== currentQuestionIndex ? styles.dotDone : ''}`}
                  onClick={() => !isSubmitting && !timeExpired && setCurrentQuestionIndex(i)}>
                  {i + 1}
                </button>
              )
            })}
          </div>

          <div className={styles.questionCard}>
            <div className={styles.questionNum}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </div>
            <div className={styles.questionText}>{currentQuestion.question}</div>
            <div className={styles.optionsList}>
              {currentQuestion.options?.map((option, i) => {
                const isSelected = answers[questionId] === i
                return (
                  <div
                    key={i}
                    className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''} ${isSubmitting || timeExpired ? styles.optionDisabled : ''}`}
                    onClick={() => handleAnswer(questionId, i)}>
                    <div className={`${styles.optionRadio} ${isSelected ? styles.optionRadioSelected : ''}`} />
                    <span className={styles.optionText}>{option}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.navButtons}>
            <button
              className={styles.btnSecondary}
              onClick={() => setCurrentQuestionIndex(p => p - 1)}
              disabled={currentQuestionIndex === 0 || isSubmitting || timeExpired}>
              ← Previous
            </button>
            <span className={styles.answeredCount}>
              {answeredCount}/{quiz.questions.length} answered
            </span>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                className={styles.btnSecondary}
                onClick={() => setCurrentQuestionIndex(p => p + 1)}
                disabled={isSubmitting || timeExpired}>
                Next →
              </button>
            ) : (
              <button
                className={styles.btnSubmit}
                onClick={() => submitQuiz(quiz, answers, false)}
                disabled={isSubmitting || timeExpired}>
                {isSubmitting ? '⏳ Submitting...' : '✓ Submit Quiz'}
              </button>
            )}
          </div>

        </div>
      </div>
    )
  }

  // results screen
  if (screen === 'results' && quiz) {
    return (
      <div className={styles.page}>
        <div className={styles.quizWrapper}>

          <div className={styles.scoreCard}>
            <div className={styles.scoreEmoji}>{timeExpired ? '⏰' : getScoreEmoji(score)}</div>
            <div className={styles.scoreTitle}>
              {timeExpired ? 'Time Expired!' : 'Quiz Completed!'}
            </div>
            <div className={styles.scoreQuizTitle}>{quiz.title}</div>
            <div className={styles.scoreBig}>{score}%</div>
            <div className={styles.scoreStats}>
              <div className={styles.scoreStat}>
                <span className={styles.scoreStatVal}>{correctAnswersCount}</span>
                <span className={styles.scoreStatLbl}>Correct</span>
              </div>
              <div className={styles.scoreStat}>
                <span className={styles.scoreStatVal}>{quiz.questions.length - correctAnswersCount}</span>
                <span className={styles.scoreStatLbl}>Wrong</span>
              </div>
              <div className={styles.scoreStat}>
                <span className={styles.scoreStatVal}>{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</span>
                <span className={styles.scoreStatLbl}>Time</span>
              </div>
            </div>
            <button
              className={styles.startBtn}
              onClick={() => { setScreen('entry'); setSelectedQuizId(''); setAnswers({}); setPasscode('') }}>
              Play Again
            </button>
          </div>

          {!timeExpired && (
            <>
              <h3 className={styles.reviewTitle}>Review Answers</h3>
              {quiz.questions.map((q, i) => {
                const qid = q._id || q.id || i.toString()
                const userAnswer = answers[qid]
                const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer
                return (
                  <div key={qid} className={styles.reviewCard}>
                    <div className={styles.reviewQuestion}>Q{i + 1}: {q.question}</div>
                    {q.options?.map((opt, j) => (
                      <div key={j} className={`${styles.reviewOption} ${j === q.correctAnswer ? styles.reviewCorrect : j === userAnswer && !isCorrect ? styles.reviewWrong : styles.reviewNeutral}`}>
                        {j === q.correctAnswer ? '✓' : j === userAnswer && !isCorrect ? '✗' : '○'} {opt}
                        {j === q.correctAnswer && ' (Correct)'}
                        {j === userAnswer && j !== q.correctAnswer && ' (Your answer)'}
                      </div>
                    ))}
                    {userAnswer === undefined && (
                      <div className={styles.reviewUnanswered}>⚠️ Not answered</div>
                    )}
                  </div>
                )
              })}

              <div className={styles.explanationSection}>
                <h3 className={styles.reviewTitle}>AI Explanations</h3>
                {isFetchingExplanations && (
                  <div className={styles.loadingText}>Generating explanations for wrong answers…</div>
                )}
                {(!isFetchingExplanations && explanations.length === 0) && (
                  <div className={styles.emptyState}>No wrong-answer explanations are available yet.</div>
                )}
                {explanations.length > 0 && explanations.map((ex, idx) => (
                  <div key={idx} className={styles.explanationCard}>
                    <div className={styles.reviewQuestion}>Question {idx + 1}</div>
                    <div className={styles.explanationText}>{ex.explanation || ex.answerExplanation || 'Explanation unavailable.'}</div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    )
  }

  return null
}
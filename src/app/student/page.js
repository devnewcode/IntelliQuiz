'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'

export default function Student() {
  const { user, loading } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timerInterval, setTimerInterval] = useState(null)
  const [timeExpired, setTimeExpired] = useState(false)
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
  const router = useRouter()

  useEffect(() => { return () => { if (timerInterval) clearInterval(timerInterval) } }, [timerInterval])

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/'); return }
      if (user.role !== 'student') { router.push('/'); return }
    }
    fetchQuizzes()
  }, [user, loading, router])

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes')
      const data = await res.json()
      if (res.ok) setQuizzes(data.quizzes || [])
    } catch (e) { console.error(e); setQuizzes([]) }
  }

  const startQuiz = (quiz) => {
    if (!quiz?.questions?.length) { alert('This quiz has no questions.'); return }
    setSelectedQuiz(quiz); setCurrentQuestionIndex(0); setAnswers({})
    setShowResults(false); setScore(0); setCorrectAnswersCount(0)
    setStartTime(new Date()); setTimeExpired(false); setIsSubmitting(false)

    if (quiz.timerEnabled && quiz.timeLimit > 0) {
      const totalSeconds = quiz.timeLimit * 60
      setTimeLeft(totalSeconds)
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(interval); setTimeExpired(true); submitQuizAutomatically(); return 0 }
          return prev - 1
        })
      }, 1000)
      setTimerInterval(interval)
    } else { setTimeLeft(null) }
  }

  const submitQuizAutomatically = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    const processedAnswers = selectedQuiz?.questions?.map((q, i) => ({
      questionId: q._id || q.id || i.toString(), selectedOption: -1, isCorrect: false
    })) || []
    await saveResult({ correctAnswers: 0, finalScore: 0, processedAnswers }, true)
    setScore(0); setCorrectAnswersCount(0); setShowResults(true); setIsSubmitting(false)
  }

  const submitQuizManually = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    const result = calculateScore()
    await saveResult(result, false)
    setScore(result.finalScore); setCorrectAnswersCount(result.correctAnswers)
    setShowResults(true); setIsSubmitting(false)
  }

  const calculateScore = () => {
    if (!selectedQuiz?.questions) return { correctAnswers: 0, finalScore: 0, processedAnswers: [] }
    let correctAnswers = 0
    const processedAnswers = selectedQuiz.questions.map((q, i) => {
      const questionId = q._id || q.id || i.toString()
      const userAnswer = answers[questionId]
      const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer
      if (isCorrect) correctAnswers++
      return { questionId, selectedOption: userAnswer ?? -1, isCorrect }
    })
    const finalScore = Math.round((correctAnswers / selectedQuiz.questions.length) * 100)
    return { correctAnswers, finalScore, processedAnswers }
  }

  const saveResult = async (result, expired) => {
    try {
      const token = localStorage.getItem('token')
      const timeTaken = startTime ? Math.floor((new Date() - startTime) / 1000) : 0
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          quizId: selectedQuiz._id, answers: result.processedAnswers,
          score: result.finalScore, totalQuestions: selectedQuiz.questions.length,
          correctAnswers: result.correctAnswers, timeTaken, timeExpired: expired
        })
      })
    } catch (e) { console.error(e) }
  }

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  const handleAnswer = (questionId, option) => {
    if (isSubmitting || timeExpired) return
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const backToQuizList = () => {
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    setSelectedQuiz(null); setShowResults(false); setStartTime(null)
    setTimeLeft(null); setTimeExpired(false); setIsSubmitting(false)
    setAnswers({}); setCurrentQuestionIndex(0)
  }

  const getScoreEmoji = (s) => s >= 80 ? '🏆' : s >= 60 ? '⭐' : s >= 40 ? '👍' : '📚'
  const getDifficultyTag = (d) => d === 'easy' ? styles.metaTagGreen : d === 'hard' ? styles.metaTagRed : styles.metaTagAmber

  if (loading) return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>
  if (!user || user.role !== 'student') return (
    <div className={styles.container}><div className={styles.alertError}>Access denied.</div></div>
  )

  /* ── RESULTS VIEW ── */
  if (showResults && selectedQuiz) {
    const timeTaken = startTime ? Math.floor((new Date() - startTime) / 1000) : 0
    return (
      <div className={styles.container}>
        <div className={styles.nav}>
          <h1 className={styles.navTitle}>Quiz Results</h1>
          <div className={styles.navRight}>
            <span className={styles.navUser}>{user.name}</span>
            <button className={styles.navBtn} onClick={() => router.push('/')}>Home</button>
            <button className={styles.navBtn} onClick={() => router.push('/results')}>All Results</button>
          </div>
        </div>

        {/* Score card */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreEmoji}>{timeExpired ? '⏰' : getScoreEmoji(score)}</div>
          <div className={styles.scoreTitle}>{timeExpired ? 'Time Expired!' : 'Quiz Completed!'}</div>
          <div className={styles.scoreQuiz}>{selectedQuiz.title}</div>
          <div className={styles.scoreBig}>{score}%</div>
          <div className={styles.scoreStats}>
            <div className={styles.scoreStat}>
              <span className={styles.scoreStatVal}>{correctAnswersCount}</span>
              <span className={styles.scoreStatLbl}>Correct</span>
            </div>
            <div className={styles.scoreStat}>
              <span className={styles.scoreStatVal}>{selectedQuiz.questions.length - correctAnswersCount}</span>
              <span className={styles.scoreStatLbl}>Wrong</span>
            </div>
            <div className={styles.scoreStat}>
              <span className={styles.scoreStatVal}>{Math.floor(timeTaken/60)}m {timeTaken%60}s</span>
              <span className={styles.scoreStatLbl}>Time Taken</span>
            </div>
          </div>
          <div className={styles.scoreActions}>
            <button className={styles.btnPrimary} onClick={backToQuizList}>Take Another Quiz</button>
            <button className={styles.btnOutline} onClick={() => router.push('/results')}>View All Results</button>
          </div>
        </div>

        {/* Review */}
        {!timeExpired && (
          <>
            <div className={styles.reviewTitle}>Review Answers</div>
            {selectedQuiz.questions.map((q, i) => {
              const qid = q._id || q.id || i.toString()
              const userAnswer = answers[qid]
              const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer
              return (
                <div key={qid} className={styles.reviewCard}>
                  <div className={styles.reviewQuestion}>Q{i+1}: {q.question}</div>
                  {q.options?.map((opt, j) => (
                    <div key={j} className={`${styles.reviewOption} ${
                      j === q.correctAnswer ? styles.reviewCorrect :
                      j === userAnswer && !isCorrect ? styles.reviewWrong : styles.reviewNeutral
                    }`}>
                      {j === q.correctAnswer ? '✓' : j === userAnswer && !isCorrect ? '✗' : '○'} {opt}
                      {j === q.correctAnswer && ' (Correct)'}
                      {j === userAnswer && j !== q.correctAnswer && ' (Your answer)'}
                    </div>
                  ))}
                  {userAnswer === undefined && <div className={styles.reviewUnanswered}>⚠️ Not answered</div>}
                </div>
              )
            })}
          </>
        )}

        {timeExpired && (
          <div className={styles.alertExpired}>
            ⏰ Quiz timed out — all answers marked incorrect. Try again within the time limit!
          </div>
        )}
      </div>
    )
  }

  /* ── QUIZ TAKING VIEW ── */
  if (selectedQuiz?.questions?.length > 0) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    if (!currentQuestion) return <div className={styles.container}><div className={styles.alertError}>Error loading question.</div></div>
    const questionId = currentQuestion._id || currentQuestion.id || currentQuestionIndex.toString()
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100
    const answeredCount = Object.keys(answers).length

    return (
      <div className={styles.container}>
        <div className={styles.nav}>
          <h1 className={styles.navTitle}>{selectedQuiz.title}</h1>
          <div className={styles.navRight}>
            {selectedQuiz.timerEnabled && timeLeft !== null && !timeExpired && (
              <span className={timeLeft < 300 ? styles.timerWarning : styles.timerNormal}>
                ⏰ {formatTime(timeLeft)}
              </span>
            )}
            <button className={styles.navBtnDanger} onClick={backToQuizList}>Exit Quiz</button>
          </div>
        </div>

        {selectedQuiz.timerEnabled && timeLeft !== null && timeLeft < 300 && !timeExpired && (
          <div className={styles.alertWarning}>⚠️ Less than 5 minutes remaining!</div>
        )}
        {timeExpired && (
          <div className={styles.alertExpired}>⏰ Time expired! Submitting your quiz...</div>
        )}

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Question dots */}
        <div className={styles.dotsNav}>
          {selectedQuiz.questions.map((_, i) => {
            const qid = selectedQuiz.questions[i]._id || selectedQuiz.questions[i].id || i.toString()
            return (
              <button key={i}
                className={`${styles.dot} ${i === currentQuestionIndex ? styles.dotCurrent : answers[qid] !== undefined ? styles.dotAnswered : ''}`}
                onClick={() => !isSubmitting && !timeExpired && setCurrentQuestionIndex(i)}>
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Question card */}
        <div className={styles.questionCard}>
          <div className={styles.questionMeta}>
            <span className={styles.questionNum}>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
            <div className={styles.questionTags}>
              <span className={`${styles.metaTag} ${getDifficultyTag(selectedQuiz.difficulty)}`}>{selectedQuiz.difficulty}</span>
              <span className={styles.metaTag}>{selectedQuiz.category}</span>
            </div>
          </div>

          <div className={styles.questionText}>{currentQuestion.question}</div>

          <div className={styles.optionsList}>
            {currentQuestion.options?.map((option, i) => {
              const isSelected = answers[questionId] === i
              return (
                <div key={i}
                  className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''} ${isSubmitting || timeExpired ? styles.optionDisabled : ''}`}
                  onClick={() => handleAnswer(questionId, i)}>
                  <div className={`${styles.optionRadio} ${isSelected ? styles.optionRadioSelected : ''}`}>
                    {isSelected && <div style={{width:8,height:8,borderRadius:'50%',background:'#fff'}}></div>}
                  </div>
                  <span className={`${styles.optionText} ${isSelected ? styles.optionTextSelected : ''}`}>{option}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Nav buttons */}
        <div className={styles.quizNav}>
          <button className={styles.btnNav} onClick={() => setCurrentQuestionIndex(p => p-1)}
            disabled={currentQuestionIndex === 0 || isSubmitting || timeExpired}>
            ← Previous
          </button>
          <span style={{fontSize:'13px',color:'#64748b',fontWeight:600}}>{answeredCount}/{selectedQuiz.questions.length} answered</span>
          {currentQuestionIndex < selectedQuiz.questions.length - 1 ? (
            <button className={styles.btnNav} onClick={() => setCurrentQuestionIndex(p => p+1)}
              disabled={isSubmitting || timeExpired}>
              Next →
            </button>
          ) : (
            <button className={styles.btnSubmit} onClick={submitQuizManually} disabled={isSubmitting || timeExpired}>
              {isSubmitting ? '⏳ Submitting...' : '✓ Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── QUIZ LIST VIEW ── */
  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <h1 className={styles.navTitle}>Available Quizzes</h1>
        <div className={styles.navRight}>
          <span className={styles.navUser}>{user.name}</span>
          <button className={styles.navBtn} onClick={() => router.push('/')}>Home</button>
          <button className={styles.navBtn} onClick={() => router.push('/results')}>My Results</button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>No quizzes available yet</div>
          <div className={styles.emptyText}>Check back later — your admin will add quizzes soon!</div>
        </div>
      ) : (
        <div className={styles.quizGrid}>
          {quizzes.map(quiz => (
            <div key={quiz._id} className={styles.quizCard}>
              <h3 className={styles.quizCardTitle}>{quiz.title}</h3>
              {quiz.description && <p className={styles.quizCardDesc}>{quiz.description}</p>}
              <div className={styles.quizMeta}>
                <span className={`${styles.metaTag} ${getDifficultyTag(quiz.difficulty)}`}>{quiz.difficulty}</span>
                <span className={styles.metaTag}>{quiz.category}</span>
                <span className={styles.metaTag}>📝 {quiz.questions?.length || 0} questions</span>
                <span className={styles.metaTag}>{quiz.timerEnabled ? `⏰ ${quiz.timeLimit} min` : '∞ No timer'}</span>
              </div>
              <button className={styles.startBtn} onClick={() => startQuiz(quiz)}>Start Quiz →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
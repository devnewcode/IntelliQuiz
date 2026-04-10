'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'

// ── Components ──
import QuizList    from '../components/quiz/QuizList'
import QuizTaking  from '../components/quiz/QuizTaking'
import QuizResults from '../components/quiz/QuizResults'

export default function Student() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // ── Quiz state ──
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
  const [startTime, setStartTime] = useState(null)

  // ── Timer state ──
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerInterval, setTimerInterval] = useState(null)
  const [timeExpired, setTimeExpired] = useState(false)

  // ── UI state ──
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Anti-cheat state ──
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [showTabWarning, setShowTabWarning] = useState(false)

  // ── AI explanation state ──
  const [explanations, setExplanations] = useState([])
  const [isFetchingExplanations, setIsFetchingExplanations] = useState(false)

  // ── Cleanup timer on unmount ──
  useEffect(() => {
    return () => { if (timerInterval) clearInterval(timerInterval) }
  }, [timerInterval])

  // ── Auth guard + fetch quizzes ──
  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/'); return }
      if (user.role !== 'student') { router.push('/'); return }
    }
    fetchQuizzes()
  }, [user, loading, router])

  // ── Tab switch detection (anti-cheat) ──
  useEffect(() => {
    if (!selectedQuiz || showResults) return
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(prev => {
          const next = prev + 1
          if (next === 1) setShowTabWarning(true)
          else if (next >= 2) submitQuizManually()
          return next
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [selectedQuiz, showResults])

  // ─────────────────────────────────────────
  // API calls
  // ─────────────────────────────────────────

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes')
      const data = await res.json()
      if (res.ok) setQuizzes(data.quizzes || [])
    } catch (e) { console.error(e); setQuizzes([]) }
  }

  const saveResult = async (result, expired) => {
    try {
      const token = localStorage.getItem('token')
      const timeTaken = startTime ? Math.floor((new Date() - startTime) / 1000) : 0
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          quizId: selectedQuiz._id,
          answers: result.processedAnswers,
          score: result.finalScore,
          totalQuestions: selectedQuiz.questions.length,
          correctAnswers: result.correctAnswers,
          timeTaken,
          timeExpired: expired
        })
      })
    } catch (e) { console.error(e) }
  }

  const fetchExplanations = async (processedAnswers) => {
    if (!selectedQuiz?.questions) return

    const wrongQuestions = processedAnswers
      .filter(a => !a.isCorrect && a.selectedOption !== -1)
      .map(a => {
        const question = selectedQuiz.questions.find(
          q => (q._id || q.id) === a.questionId ||
               selectedQuiz.questions.indexOf(q).toString() === a.questionId
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
    } catch (e) { console.error('Failed to fetch explanations:', e) }
    setIsFetchingExplanations(false)
  }

  // ─────────────────────────────────────────
  // Quiz logic
  // ─────────────────────────────────────────

  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const startQuiz = (quiz) => {
    if (!quiz?.questions?.length) { alert('This quiz has no questions.'); return }

    // Shuffle questions and options
    const shuffledQuestions = shuffleArray(quiz.questions).map(q => {
      const correctAnswerText = q.options[q.correctAnswer]
      const shuffledOptions = shuffleArray(q.options)
      const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText)
      return { ...q, options: shuffledOptions, correctAnswer: newCorrectIndex }
    })
    quiz = { ...quiz, questions: shuffledQuestions }

    // Reset all state
    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    setScore(0)
    setCorrectAnswersCount(0)
    setStartTime(new Date())
    setTimeExpired(false)
    setIsSubmitting(false)
    setTabSwitchCount(0)
    setShowTabWarning(false)
    setExplanations([])

    // Start timer if enabled
    if (quiz.timerEnabled && quiz.timeLimit > 0) {
      const totalSeconds = quiz.timeLimit * 60
      setTimeLeft(totalSeconds)
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setTimeExpired(true)
            submitQuizAutomatically()
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

  const submitQuizManually = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    const result = calculateScore()
    await saveResult(result, false)
    setScore(result.finalScore)
    setCorrectAnswersCount(result.correctAnswers)
    setShowResults(true)
    setIsSubmitting(false)
    fetchExplanations(result.processedAnswers)
  }

  const submitQuizAutomatically = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    const processedAnswers = selectedQuiz?.questions?.map((q, i) => ({
      questionId: q._id || q.id || i.toString(),
      selectedOption: -1,
      isCorrect: false
    })) || []
    await saveResult({ correctAnswers: 0, finalScore: 0, processedAnswers }, true)
    setScore(0)
    setCorrectAnswersCount(0)
    setShowResults(true)
    setIsSubmitting(false)
  }

  const handleAnswer = (questionId, option) => {
    if (isSubmitting || timeExpired) return
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const backToQuizList = () => {
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    setSelectedQuiz(null)
    setShowResults(false)
    setStartTime(null)
    setTimeLeft(null)
    setTimeExpired(false)
    setIsSubmitting(false)
    setAnswers({})
    setCurrentQuestionIndex(0)
    setTabSwitchCount(0)
    setShowTabWarning(false)
    setExplanations([])
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading...</div>
    </div>
  )

  if (!user || user.role !== 'student') return (
    <div className={styles.container}>
      <div className={styles.alertError}>Access denied.</div>
    </div>
  )

  // ── Results view ──
  if (showResults && selectedQuiz) {
    const timeTaken = startTime ? Math.floor((new Date() - startTime) / 1000) : 0
    return (
      <QuizResults
        quiz={selectedQuiz}
        score={score}
        correctAnswersCount={correctAnswersCount}
        answers={answers}
        timeTaken={timeTaken}
        timeExpired={timeExpired}
        explanations={explanations}
        isFetchingExplanations={isFetchingExplanations}
        user={user}
        onTakeAnother={backToQuizList}
        onViewResults={() => router.push('/results')}
        onGoHome={() => router.push('/')}
        onGoAllResults={() => router.push('/results')}
      />
    )
  }

  // ── Quiz taking view ──
  if (selectedQuiz?.questions?.length > 0) {
    return (
      <QuizTaking
        quiz={selectedQuiz}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        timeLeft={timeLeft}
        timeExpired={timeExpired}
        isSubmitting={isSubmitting}
        showTabWarning={showTabWarning}
        tabSwitchCount={tabSwitchCount}
        onAnswer={handleAnswer}
        onNext={() => setCurrentQuestionIndex(p => p + 1)}
        onPrev={() => setCurrentQuestionIndex(p => p - 1)}
        onNavigateTo={(i) => setCurrentQuestionIndex(i)}
        onSubmit={submitQuizManually}
        onExit={backToQuizList}
        onDismissWarning={() => setShowTabWarning(false)}
      />
    )
  }

  // ── Quiz list view ──
  return (
    <QuizList
      quizzes={quizzes}
      onStartQuiz={startQuiz}
      user={user}
      onGoHome={() => router.push('/')}
      onGoResults={() => router.push('/results')}
    />
  )
}
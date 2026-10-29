'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'

import QuizList from '../components/quiz/QuizList'
import QuizTaking from '../components/quiz/QuizTaking'
import QuizResults from '../components/quiz/QuizResults'

export default function Student() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
  const [startTime, setStartTime] = useState(null)

  const [timeLeft, setTimeLeft] = useState(null)
  const [timerInterval, setTimerInterval] = useState(null)
  const [timeExpired, setTimeExpired] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [showTabWarning, setShowTabWarning] = useState(false)

  const [explanations, setExplanations] = useState([])
  const [isFetchingExplanations, setIsFetchingExplanations] = useState(false)

  const answersRef = useRef({})
  useEffect(() => { answersRef.current = answers }, [answers])

  const submitQuizManuallyRef = useRef(null)

  useEffect(() => {
    return () => { if (timerInterval) clearInterval(timerInterval) }
  }, [timerInterval])

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/'); return }
      if (user.role !== 'student') { router.push('/'); return }
    }
    fetchQuizzes()
  }, [user, loading, router])

  // Anti-cheat: tab switch detection
  useEffect(() => {
    if (!selectedQuiz || showResults) return
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(prev => {
          const next = prev + 1
          if (next === 1) setShowTabWarning(true)
          else if (next >= 2) submitQuizManuallyRef.current?.()
          return next
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [selectedQuiz, showResults])

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/quizzes', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      if (res.ok) setQuizzes(data.quizzes || [])
    } catch (e) { console.error(e); setQuizzes([]) }
  }

  const saveResult = async (submittedAnswers, expired) => {
    try {
      const token = localStorage.getItem('token')
      const timeTaken = startTime ? Math.floor((new Date() - startTime) / 1000) : 0
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          quizId: selectedQuiz._id,
          answers: submittedAnswers,
          timeTaken,
          timeExpired: expired
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        return data.result
      }
    } catch (e) {
      console.error('Failed to save result:', e)
    }
    return null
  }

  const fetchExplanationsFromReview = async (review) => {
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
      const token = localStorage.getItem('token')
      const res = await fetch('/api/explain-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ wrongQuestions })
      })
      const data = await res.json()
      if (res.ok && data.explanations) setExplanations(data.explanations)
    } catch (e) {
      console.error('Failed to fetch explanations:', e)
    }
    setIsFetchingExplanations(false)
  }

  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const startQuiz = (quiz) => {
    if (!quiz?.questions?.length) { alert('This quiz has no questions.'); return }

    const questionsWithShuffledOptions = quiz.questions.map(q => {
      const shuffledOptions = shuffleArray(q.options || [])
      return { ...q, options: shuffledOptions }
    })
    const preparedQuiz = { ...quiz, questions: questionsWithShuffledOptions }

    setSelectedQuiz(preparedQuiz)
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

  const submitQuizManually = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }

    const curAnswers = answersRef.current || answers || {}
    const payloadAnswers = (selectedQuiz?.questions || []).map((q, i) => {
      const questionId = q._id || q.id || i.toString()
      const selectedIndex = curAnswers[questionId]
      const selectedOptionText = selectedIndex !== undefined ? q.options[selectedIndex] : null
      return { questionId, selectedOptionText }
    })

    const graded = await saveResult(payloadAnswers, false)
    if (graded) {
      setScore(graded.score)
      setCorrectAnswersCount(graded.correctAnswers)
      if (graded.review) {
        const updatedQuestions = selectedQuiz.questions.map((q) => {
          const qid = String(q._id || q.id)
          const rev = graded.review.find((r) => String(r.questionId) === qid)
          const correctIdx = rev ? q.options.indexOf(rev.correctAnswerText) : -1
          return { ...q, correctAnswer: correctIdx }
        })
        setSelectedQuiz(prev => ({ ...prev, questions: updatedQuestions }))
        fetchExplanationsFromReview(graded.review)
      }
    }

    setShowResults(true)
    setIsSubmitting(false)
  }

  submitQuizManuallyRef.current = submitQuizManually

  const submitQuizAutomatically = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }

    const curAnswers = answersRef.current || {}
    const payloadAnswers = (selectedQuiz?.questions || []).map((q, i) => {
      const questionId = q._id || q.id || i.toString()
      const selectedIndex = curAnswers[questionId]
      const selectedOptionText = selectedIndex !== undefined ? q.options[selectedIndex] : null
      return { questionId, selectedOptionText }
    })

    const graded = await saveResult(payloadAnswers, true)
    if (graded) {
      setScore(graded.score)
      setCorrectAnswersCount(graded.correctAnswers)
      if (graded.review) {
        const updatedQuestions = selectedQuiz.questions.map((q) => {
          const qid = String(q._id || q.id)
          const rev = graded.review.find((r) => String(r.questionId) === qid)
          const correctIdx = rev ? q.options.indexOf(rev.correctAnswerText) : -1
          return { ...q, correctAnswer: correctIdx }
        })
        setSelectedQuiz(prev => ({ ...prev, questions: updatedQuestions }))
        fetchExplanationsFromReview(graded.review)
      }
    } else {
      setScore(0)
      setCorrectAnswersCount(0)
    }

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

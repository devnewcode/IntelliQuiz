'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'

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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  // Auth and initial data fetch
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
      if (user.role !== 'student') {
        router.push('/')
        return
      }
    }
    fetchQuizzes()
  }, [user, loading, router])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes')
      const data = await response.json()
      if (response.ok) {
        setQuizzes(data.quizzes || [])
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
      setQuizzes([])
    }
  }

  const startQuiz = (quiz) => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      alert('This quiz has no questions available.')
      return
    }

    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    setScore(0)
    setCorrectAnswersCount(0)
    setStartTime(new Date())
    setTimeExpired(false)
    setIsSubmitting(false)
    
    // Setup timer if enabled
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

  const submitQuizAutomatically = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    
    // Simple logic: Time expired = Score 0
    const processedAnswers = []
    if (selectedQuiz && selectedQuiz.questions) {
      selectedQuiz.questions.forEach((question, index) => {
        const questionId = question._id || question.id || index.toString()
        processedAnswers.push({
          questionId: questionId,
          selectedOption: -1, // No answer counted
          isCorrect: false // All wrong when time expires
        })
      })
    }
    
    const result = {
      correctAnswers: 0, // Always 0 when time expires
      finalScore: 0, // Always 0 when time expires
      processedAnswers: processedAnswers
    }
    
    await saveResult(result, true) // true = time expired
    
    setScore(0) // Always 0
    setCorrectAnswersCount(0) // Always 0
    setShowResults(true)
    setIsSubmitting(false)
    
    alert('⏰ Time is up! Score: 0% (Time penalty applied)')
  }

  const submitQuizManually = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    
    const result = calculateScore()
    await saveResult(result, false) // false = manual submission
    
    setScore(result.finalScore)
    setCorrectAnswersCount(result.correctAnswers)
    setShowResults(true)
    setIsSubmitting(false)
  }

  const calculateScore = () => {
    if (!selectedQuiz || !selectedQuiz.questions) {
      return { correctAnswers: 0, finalScore: 0, processedAnswers: [] }
    }

    let correctAnswers = 0
    const processedAnswers = []

    selectedQuiz.questions.forEach((question, index) => {
      const questionId = question._id || question.id || index.toString()
      const userAnswer = answers[questionId]
      
      const isAnswered = userAnswer !== undefined && userAnswer !== null
      const isCorrect = isAnswered && userAnswer === question.correctAnswer
      
      if (isCorrect) correctAnswers++
      
      processedAnswers.push({
        questionId: questionId,
        selectedOption: isAnswered ? userAnswer : -1,
        isCorrect: isCorrect
      })
    })
    
    const totalQuestions = selectedQuiz.questions.length
    const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    
    return { correctAnswers, finalScore, processedAnswers }
  }

  const saveResult = async (result, timeExpired) => {
    try {
      const token = localStorage.getItem('token')
      const timeTaken = startTime ? Math.floor((new Date() - startTime) / 1000) : 0
      
      await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId: selectedQuiz._id,
          answers: result.processedAnswers,
          score: result.finalScore,
          totalQuestions: selectedQuiz.questions.length,
          correctAnswers: result.correctAnswers,
          timeTaken: timeTaken,
          timeExpired: timeExpired
        })
      })
    } catch (error) {
      console.error('Failed to save result:', error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId, selectedOption) => {
    if (isSubmitting || timeExpired) return
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }))
  }

  const nextQuestion = () => {
    if (isSubmitting || timeExpired) return
    
    if (selectedQuiz && selectedQuiz.questions && currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (isSubmitting || timeExpired) return
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const backToQuizList = () => {
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    
    setSelectedQuiz(null)
    setShowResults(false)
    setStartTime(null)
    setTimeLeft(null)
    setTimeExpired(false)
    setIsSubmitting(false)
    setAnswers({})
    setCurrentQuestionIndex(0)
  }

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  // Access control
  if (!user || user.role !== 'student') {
    return (
      <div className="container">
        <div className="error">Access denied. Student privileges required.</div>
      </div>
    )
  }

  // Results view
  if (showResults && selectedQuiz) {
    return (
      <div className="container">
        <div className="nav">
          <h1>Quiz Results</h1>
          <div className="user-info">
            {user.name}
            <button onClick={() => router.push('/')}>Home</button>
          </div>
          <div style={{ clear: 'both' }}></div>
        </div>

        {timeExpired && (
          <div className="error" style={{ textAlign: 'center', fontSize: '16px', marginBottom: '20px' }}>
            ⏰ Time Expired! Automatic Score: 0% (Time Penalty)
          </div>
        )}

        <div className="score">
          <h2>Quiz Completed!</h2>
          <h3>{selectedQuiz.title}</h3>
          <p><strong>Your Score: {score}%</strong></p>
          <p>Correct Answers: {correctAnswersCount} out of {selectedQuiz.questions.length}</p>
          {startTime && (
            <p>Time Taken: {Math.floor((new Date() - startTime) / 1000)} seconds</p>
          )}
        </div>

        <h3>Review Answers:</h3>
        {timeExpired ? (
          <div className="quiz-item" style={{ textAlign: 'center', color: '#dc3545' }}>
            <h4>⏰ Quiz Timed Out</h4>
            <p>All answers are marked incorrect due to time expiration.</p>
            <p>Complete the quiz within the time limit to get your actual score!</p>
          </div>
        ) : (
          selectedQuiz.questions.map((question, index) => {
            const questionId = question._id || question.id || index.toString()
            const userAnswer = answers[questionId]
            const isAnswered = userAnswer !== undefined && userAnswer !== null
            const isCorrect = isAnswered && userAnswer === question.correctAnswer
            
            return (
              <div key={questionId} className="quiz-item">
                <h4>Q{index + 1}: {question.question}</h4>
                {question.options && question.options.map((option, optIndex) => (
                  <div key={optIndex} className={`option ${
                    optIndex === question.correctAnswer ? 'correct-answer' : 
                    optIndex === userAnswer && !isCorrect ? 'wrong-answer' : ''
                  }`}>
                    {optIndex + 1}. {option}
                    {optIndex === question.correctAnswer && ' ✓ (Correct)'}
                    {optIndex === userAnswer && optIndex !== question.correctAnswer && ' ✗ (Your answer)'}
                  </div>
                ))}
                {!isAnswered && (
                  <div style={{ color: '#dc3545', fontWeight: 'bold', marginTop: '10px' }}>
                    ⚠️ No answer provided
                  </div>
                )}
              </div>
            )
          })
        )}

        <button onClick={backToQuizList}>Back to Quiz List</button>
        <button onClick={() => router.push('/results')}>View All Results</button>
      </div>
    )
  }

  // Quiz taking view
  if (selectedQuiz && selectedQuiz.questions && selectedQuiz.questions.length > 0) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    
    if (!currentQuestion) {
      return (
        <div className="container">
          <div className="error">Error: Invalid question data.</div>
          <button onClick={backToQuizList}>Back to Quiz List</button>
        </div>
      )
    }
    
    const questionId = currentQuestion._id || currentQuestion.id || currentQuestionIndex.toString()
    
    return (
      <div className="container">
        <div className="nav">
          <h1>{selectedQuiz.title}</h1>
          <div className="user-info">
            Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
            {selectedQuiz.timerEnabled && timeLeft !== null && !timeExpired && (
              <span style={{ 
                marginLeft: '20px', 
                color: timeLeft < 300 ? '#dc3545' : '#007bff',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                ⏰ {formatTime(timeLeft)}
              </span>
            )}
            <button onClick={backToQuizList}>Exit Quiz</button>
          </div>
          <div style={{ clear: 'both' }}></div>
        </div>

        {selectedQuiz.timerEnabled && timeLeft !== null && timeLeft < 300 && !timeExpired && (
          <div className="error" style={{ textAlign: 'center', fontSize: '16px' }}>
            ⚠️ Warning: Less than 5 minutes remaining!
          </div>
        )}

        {timeExpired && (
          <div className="error" style={{ textAlign: 'center', fontSize: '16px' }}>
            ⏰ Time has expired! Please wait while we submit your quiz...
          </div>
        )}

        <div className="quiz-item">
          <div style={{ marginBottom: '15px', color: '#666' }}>
            <strong>Category:</strong> {selectedQuiz.category} | <strong>Difficulty:</strong> {selectedQuiz.difficulty}
            {selectedQuiz.timerEnabled && (
              <span> | <strong>Time Limit:</strong> {selectedQuiz.timeLimit} minutes</span>
            )}
          </div>
          <h3 style={{ 
            background: '#f8fafc', 
            padding: '16px', 
            borderRadius: '10px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '16px',
            lineHeight: '1.5',
            border: '2px solid #e2e8f0',
            color: '#1e293b'
          }}>
            {currentQuestion.question}
          </h3>
          
          {currentQuestion.options && currentQuestion.options.map((option, index) => (
            <div key={index} className="option">
              <input
                type="radio"
                name={`question-${questionId}`}
                value={index}
                checked={answers[questionId] === index}
                onChange={() => handleAnswer(questionId, index)}
                disabled={isSubmitting || timeExpired}
              />
              <span style={{ opacity: (isSubmitting || timeExpired) ? 0.5 : 1 }}>
                {option}
              </span>
            </div>
          ))}
        </div>

        <div>
          <button 
            onClick={prevQuestion} 
            disabled={currentQuestionIndex === 0 || isSubmitting || timeExpired}
          >
            Previous
          </button>
          
          {currentQuestionIndex < selectedQuiz.questions.length - 1 ? (
            <button 
              onClick={nextQuestion}
              disabled={isSubmitting || timeExpired}
            >
              Next
            </button>
          ) : (
            <button 
              className="btn-success" 
              onClick={submitQuizManually}
              disabled={isSubmitting || timeExpired}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Main quiz list view
  return (
    <div className="container">
      <div className="nav">
        <h1>Available Quizzes</h1>
        <div className="user-info">
          {user.name}
          <button onClick={() => router.push('/')}>Home</button>
          <button onClick={() => router.push('/results')}>View Results</button>
        </div>
        <div style={{ clear: 'both' }}></div>
      </div>

      {quizzes.length === 0 ? (
        <div className="quiz-item">
          <p>No quizzes available yet. Please check back later.</p>
        </div>
      ) : (
        quizzes.map(quiz => (
          <div key={quiz._id} className="quiz-item">
            <h3>{quiz.title}</h3>
            <p><strong>Description:</strong> {quiz.description}</p>
            <p><strong>Category:</strong> {quiz.category} | <strong>Difficulty:</strong> {quiz.difficulty}</p>
            <p><strong>Questions:</strong> {quiz.questions ? quiz.questions.length : 0}</p>
            <p><strong>Time Limit:</strong> {quiz.timerEnabled ? `${quiz.timeLimit} minutes` : 'No time limit'}</p>
            <p><strong>Created by:</strong> {quiz.createdBy?.name || 'Unknown'}</p>
            <button onClick={() => startQuiz(quiz)}>Start Quiz</button>
          </div>
        ))
      )}
    </div>
  )
}

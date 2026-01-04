'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'

export default function Admin() {
  const { user, loading } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    category: 'General',
    difficulty: 'medium',
    timeLimit: 30,
    timerEnabled: true,
    questions: []
  })
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
      if (user.role !== 'admin') {
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
        setQuizzes(data.quizzes)
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    }
  }

  const addQuestion = () => {
    if (!currentQuestion.question.trim() || currentQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill all question fields')
      return
    }

    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, { ...currentQuestion, id: Date.now().toString() }]
    })

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    })
  }

  const removeQuestion = (questionId) => {
    setNewQuiz({
      ...newQuiz,
      questions: newQuiz.questions.filter(q => q.id !== questionId)
    })
  }

  const deleteQuiz = async (quizId, quizTitle) => {
    if (!confirm(`Are you sure you want to delete the quiz "${quizTitle}"?\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Quiz deleted successfully!')
        fetchQuizzes()
      } else {
        setMessage(data.message || 'Failed to delete quiz')
      }
    } catch (error) {
      setMessage('Failed to delete quiz')
    }
  }

  const saveQuiz = async () => {
    if (!newQuiz.title.trim() || newQuiz.questions.length === 0) {
      alert('Please provide quiz title and at least one question')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuiz)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Quiz created successfully!')
        setNewQuiz({
          title: '',
          description: '',
          category: 'General',
          difficulty: 'medium',
          timeLimit: 30,
          timerEnabled: true,
          questions: []
        })
        fetchQuizzes()
      } else {
        setMessage(data.message || 'Failed to create quiz')
      }
    } catch (error) {
      setMessage('Failed to create quiz')
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container">
        <div className="error">Access denied. Admin privileges required.</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="nav">
        <h1>Admin Panel</h1>
        <div className="user-info">
          {user.name}
          <button onClick={() => router.push('/')}>Home</button>
          {/* <button onClick={() => router.push('/results')}>View Results</button> */}
        </div>
        <div style={{ clear: 'both' }}></div>
      </div>

      {message && (
        <div className={message.includes('success') ? 'success' : 'error'}>
          {message}
        </div>
      )}

      <h2>Create New Quiz</h2>
      
      <div className="form-group">
        <label>Quiz Title:</label>
        <input
          type="text"
          value={newQuiz.title}
          onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
          placeholder="Enter quiz title"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea
          value={newQuiz.description}
          onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
          placeholder="Enter quiz description"
          rows="3"
          disabled={isSubmitting}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Category:</label>
          <input
            type="text"
            value={newQuiz.category}
            onChange={(e) => setNewQuiz({...newQuiz, category: e.target.value})}
            placeholder="e.g., Math, Science, History"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Difficulty:</label>
          <select
            value={newQuiz.difficulty}
            onChange={(e) => setNewQuiz({...newQuiz, difficulty: e.target.value})}
            disabled={isSubmitting}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>
            <input
              type="checkbox"
              checked={newQuiz.timerEnabled}
              onChange={(e) => setNewQuiz({...newQuiz, timerEnabled: e.target.checked})}
              disabled={isSubmitting}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            Enable Timer
          </label>
        </div>

        {newQuiz.timerEnabled && (
          <div className="form-group" style={{ flex: 1 }}>
            <label>Time Limit (minutes):</label>
            <input
              type="number"
              value={newQuiz.timeLimit}
              onChange={(e) => setNewQuiz({...newQuiz, timeLimit: parseInt(e.target.value) || 30})}
              min="1"
              max="300"
              disabled={isSubmitting}
              placeholder="30"
            />
          </div>
        )}
      </div>

      <h3>Add Question</h3>
      <div className="form-group">
        <label>Question:</label>
        <textarea
          value={currentQuestion.question}
          onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
          placeholder="Enter your question here... You can write multiple lines, code snippets, or long explanations."
          disabled={isSubmitting}
          rows="4"
          style={{ 
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            resize: 'vertical',
            minHeight: '100px'
          }}
        />
        <small style={{ color: '#64748b', fontSize: '12px' }}>
          Tip: You can write multi-line questions, code examples, or detailed explanations.
        </small>
      </div>

      {currentQuestion.options.map((option, index) => (
        <div key={index} className="form-group">
          <label>Option {index + 1}:</label>
          <input
            type="text"
            value={option}
            onChange={(e) => {
              const newOptions = [...currentQuestion.options]
              newOptions[index] = e.target.value
              setCurrentQuestion({...currentQuestion, options: newOptions})
            }}
            placeholder={`Enter option ${index + 1}`}
            disabled={isSubmitting}
          />
          <input
            type="radio"
            name="correctAnswer"
            checked={currentQuestion.correctAnswer === index}
            onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: index})}
            style={{ width: 'auto', marginLeft: '10px' }}
            disabled={isSubmitting}
          />
          <span style={{ marginLeft: '5px' }}>Correct Answer</span>
        </div>
      ))}

      <button onClick={addQuestion} disabled={isSubmitting}>Add Question</button>

      {newQuiz.questions.length > 0 && (
        <div>
          <h3>Questions Added ({newQuiz.questions.length})</h3>
          {newQuiz.questions.map((question, index) => (
            <div key={question.id} className="quiz-item">
              <h4>Q{index + 1}:</h4>
              <div style={{ 
                background: '#f8fafc', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '12px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '14px',
                border: '1px solid #e2e8f0'
              }}>
                {question.question}
              </div>
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className={question.correctAnswer === optIndex ? 'correct-answer' : ''} style={{ padding: '4px 8px', marginBottom: '4px' }}>
                  {optIndex + 1}. {option}
                  {question.correctAnswer === optIndex && ' ✓'}
                </div>
              ))}
              <button 
                className="btn-danger" 
                onClick={() => removeQuestion(question.id)}
                disabled={isSubmitting}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button 
          className="btn-success" 
          onClick={saveQuiz}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
        </button>
      </div>

      <h2 style={{ marginTop: '40px' }}>Existing Quizzes</h2>
      {quizzes.length === 0 ? (
        <p>No quizzes created yet.</p>
      ) : (
        quizzes.map(quiz => (
          <div key={quiz._id} className="quiz-item">
            <h3>{quiz.title}</h3>
            <p><strong>Description:</strong> {quiz.description}</p>
            <p><strong>Category:</strong> {quiz.category}</p>
            <p><strong>Difficulty:</strong> {quiz.difficulty}</p>
            <p><strong>Questions:</strong> {quiz.questions.length}</p>
            <p><strong>Timer:</strong> {quiz.timerEnabled ? `${quiz.timeLimit} minutes` : 'Disabled'}</p>
            <p><strong>Created:</strong> {new Date(quiz.createdAt).toLocaleDateString()}</p>
            <p><strong>Created by:</strong> {quiz.createdBy?.name || 'Unknown'}</p>
            
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => deleteQuiz(quiz._id, quiz.title)}
                className="btn-danger"
                disabled={isSubmitting}
              >
                Delete Quiz
              </button>
              <button 
                onClick={() => {
                  const confirmed = confirm(`This will show you all questions in "${quiz.title}"`)
                  if (confirmed) {
                    console.log('Quiz details:', quiz.questions)
                    alert(`This quiz has ${quiz.questions.length} questions. Check browser console for details.`)
                  }
                }}
                style={{ backgroundColor: '#6366f1' }}
              >
                Preview Questions
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
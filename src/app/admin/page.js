'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'

export default function Admin() {
  const { user, loading } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [newQuiz, setNewQuiz] = useState({
    title: '', description: '', category: 'General',
    difficulty: 'medium', timeLimit: 30, timerEnabled: true, questions: []
  })
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '', options: ['', '', '', ''], correctAnswer: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/'); return }
      if (user.role !== 'admin') { router.push('/'); return }
    }
    fetchQuizzes()
  }, [user, loading, router])

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes')
      const data = await res.json()
      if (res.ok) setQuizzes(data.quizzes)
    } catch (e) { console.error(e) }
  }

  const addQuestion = () => {
    if (!currentQuestion.question.trim() || currentQuestion.options.some(o => !o.trim())) {
      alert('Please fill all question fields'); return
    }
    setNewQuiz({ ...newQuiz, questions: [...newQuiz.questions, { ...currentQuestion, id: Date.now().toString() }] })
    setCurrentQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0 })
  }

  const removeQuestion = (id) =>
    setNewQuiz({ ...newQuiz, questions: newQuiz.questions.filter(q => q.id !== id) })

  const deleteQuiz = async (quizId, quizTitle) => {
    if (!confirm(`Delete "${quizTitle}"? This cannot be undone.`)) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) { setMessage('Quiz deleted successfully!'); fetchQuizzes() }
      else setMessage(data.message || 'Failed to delete quiz')
    } catch { setMessage('Failed to delete quiz') }
  }

  const saveQuiz = async () => {
    if (!newQuiz.title.trim() || newQuiz.questions.length === 0) {
      alert('Please provide quiz title and at least one question'); return
    }
    setIsSubmitting(true); setMessage('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newQuiz)
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Quiz created successfully!')
        setNewQuiz({ title: '', description: '', category: 'General', difficulty: 'medium', timeLimit: 30, timerEnabled: true, questions: [] })
        fetchQuizzes()
      } else setMessage(data.message || 'Failed to create quiz')
    } catch { setMessage('Failed to create quiz') }
    setIsSubmitting(false)
  }

  if (loading) return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>
  if (!user || user.role !== 'admin') return (
    <div className={styles.container}>
      <div className={`${styles.alert} ${styles.alertError}`}>Access denied. Admin privileges required.</div>
    </div>
  )

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Admin Panel</h1>
        <div className={styles.headerActions}>
          <span className={styles.userName}>{user.name}</span>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => router.push('/')}>Home</button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => router.push('/results')}>View Results</button>
        </div>
      </div>

      {/* ── Alert ── */}
      {message && (
        <div className={`${styles.alert} ${message.includes('success') ? styles.alertSuccess : styles.alertError}`}>
          {message}
        </div>
      )}

      {/* ── Create Quiz Card ── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Create New Quiz</h2>

        <div className={styles.formGroup}>
          <label className={styles.label}>Quiz Title</label>
          <input className={styles.input} type="text" value={newQuiz.title}
            onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })}
            placeholder="Enter quiz title" disabled={isSubmitting} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea className={styles.textarea} value={newQuiz.description}
            onChange={e => setNewQuiz({ ...newQuiz, description: e.target.value })}
            placeholder="Enter quiz description" rows="3" disabled={isSubmitting} />
        </div>

        <div className={styles.flexRow}>
          <div className={`${styles.formGroup} ${styles.flexColumn}`}>
            <label className={styles.label}>Category</label>
            <input className={styles.input} type="text" value={newQuiz.category}
              onChange={e => setNewQuiz({ ...newQuiz, category: e.target.value })}
              placeholder="e.g., Math, Science, History" disabled={isSubmitting} />
          </div>
          <div className={`${styles.formGroup} ${styles.flexColumn}`}>
            <label className={styles.label}>Difficulty</label>
            <select className={styles.select} value={newQuiz.difficulty}
              onChange={e => setNewQuiz({ ...newQuiz, difficulty: e.target.value })} disabled={isSubmitting}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className={styles.flexRow}>
          <div className={`${styles.formGroup} ${styles.flexColumn}`}>
            <label className={styles.checkboxLabel}>
              <input className={styles.checkbox} type="checkbox"
                checked={newQuiz.timerEnabled}
                onChange={e => setNewQuiz({ ...newQuiz, timerEnabled: e.target.checked })}
                disabled={isSubmitting} />
              Enable Timer
            </label>
          </div>
          {newQuiz.timerEnabled && (
            <div className={`${styles.formGroup} ${styles.flexColumn}`}>
              <label className={styles.label}>Time Limit (minutes)</label>
              <input className={styles.input} type="number" value={newQuiz.timeLimit}
                onChange={e => setNewQuiz({ ...newQuiz, timeLimit: parseInt(e.target.value) || 30 })}
                min="1" max="300" disabled={isSubmitting} placeholder="30" />
            </div>
          )}
        </div>
      </div>

      {/* ── Add Question Card ── */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Add Question</h3>

        <div className={styles.formGroup}>
          <label className={styles.label}>Question</label>
          <textarea className={styles.textarea} value={currentQuestion.question}
            onChange={e => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
            placeholder="Enter your question here... You can write multiple lines, code snippets, or long explanations."
            disabled={isSubmitting} rows="4" />
          <span className={styles.inputHint}>Tip: You can write multi-line questions, code examples, or detailed explanations.</span>
        </div>

        {currentQuestion.options.map((option, index) => (
          <div key={index} className={styles.formGroup}>
            <label className={styles.label}>Option {index + 1}</label>
            <div className={styles.radioGroup}>
              <input className={styles.input} type="text" value={option}
                onChange={e => {
                  const opts = [...currentQuestion.options]
                  opts[index] = e.target.value
                  setCurrentQuestion({ ...currentQuestion, options: opts })
                }}
                placeholder={`Enter option ${index + 1}`} disabled={isSubmitting} />
              <input className={styles.radioInput} type="radio" name="correctAnswer"
                checked={currentQuestion.correctAnswer === index}
                onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                disabled={isSubmitting} />
              <span className={styles.radioLabel}>Correct</span>
            </div>
          </div>
        ))}

        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={addQuestion} disabled={isSubmitting}>
          + Add Question
        </button>

        {/* Questions preview */}
        {newQuiz.questions.length > 0 && (
          <div className={styles.questionsSummary}>
            <h3 className={styles.summaryTitle}>Questions Added ({newQuiz.questions.length})</h3>
            {newQuiz.questions.map((question, index) => (
              <div key={question.id} className={styles.questionCard}>
                <div className={styles.questionHeader}>Question {index + 1}</div>
                <div className={styles.questionText}>{question.question}</div>
                <div className={styles.optionList}>
                  {question.options.map((opt, i) => (
                    <div key={i} className={`${styles.optionItem} ${question.correctAnswer === i ? styles.correctOption : ''}`}>
                      {i + 1}. {opt}{question.correctAnswer === i && ' ✓'}
                    </div>
                  ))}
                </div>
                <button className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => removeQuestion(question.id)} disabled={isSubmitting}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #f1f5f9' }}>
          <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={saveQuiz} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Quiz...' : '✓ Create Quiz'}
          </button>
        </div>
      </div>

      {/* ── Existing Quizzes ── */}
      <h2 className={styles.sectionTitle} style={{ marginTop: '8px' }}>Existing Quizzes</h2>

      {quizzes.length === 0 ? (
        <div className={styles.emptyState}>No quizzes created yet.</div>
      ) : (
        quizzes.map(quiz => (
          <div key={quiz._id} className={styles.quizItem}>
            <h3 className={styles.quizTitle}>{quiz.title}</h3>
            <p className={styles.quizInfo}><span className={styles.quizLabel}>Description: </span>{quiz.description}</p>
            <p className={styles.quizInfo}><span className={styles.quizLabel}>Category: </span>{quiz.category}</p>
            <p className={styles.quizInfo}><span className={styles.quizLabel}>Difficulty: </span>{quiz.difficulty}</p>
            <p className={styles.quizInfo}><span className={styles.quizLabel}>Questions: </span>{quiz.questions.length}</p>
            <p className={styles.quizInfo}><span className={styles.quizLabel}>Timer: </span>{quiz.timerEnabled ? `${quiz.timeLimit} minutes` : 'Disabled'}</p>
            <p className={styles.quizInfo}><span className={styles.quizLabel}>Created: </span>{new Date(quiz.createdAt).toLocaleDateString()}</p>
            <p className={styles.quizInfo}><span className={styles.quizLabel}>By: </span>{quiz.createdBy?.name || 'Unknown'}</p>
            <div className={styles.quizActions}>
              <button className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => deleteQuiz(quiz._id, quiz.title)} disabled={isSubmitting}>
                Delete Quiz
              </button>
              <button className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  if (confirm(`Show questions for "${quiz.title}"?`)) {
                    console.log('Quiz questions:', quiz.questions)
                    alert(`${quiz.questions.length} questions. See browser console for details.`)
                  }
                }}>
                Preview Questions
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
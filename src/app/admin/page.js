'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'

// ── Components ──
import CreateQuizForm from '../components/admin/CreateQuizForm'
import AIGenerator    from '../components/admin/AIGenerator'
import QuestionEditor from '../components/admin/QuestionEditor'
import AdminQuizList  from '../components/admin/AdminQuizList'

export default function Admin() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // ── Quiz being built ──
  const [newQuiz, setNewQuiz] = useState({
    title: '', description: '', category: 'General',
    difficulty: 'medium', timeLimit: 30, timerEnabled: true, questions: []
  })

  // ── Existing quizzes ──
  const [quizzes, setQuizzes] = useState([])

  // ── UI state ──
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // ── Auth guard ──
  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/'); return }
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        router.push('/'); return
      }
    }
    fetchQuizzes()
  }, [user, loading, router])

  // ─────────────────────────────────────────
  // API calls
  // ─────────────────────────────────────────

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/quizzes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setQuizzes(data.quizzes)
    } catch (e) { console.error(e) }
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
        setNewQuiz({
          title: '', description: '', category: 'General',
          difficulty: 'medium', timeLimit: 30, timerEnabled: true, questions: []
        })
        fetchQuizzes()
      } else {
        setMessage(data.message || 'Failed to create quiz')
      }
    } catch {
      setMessage('Failed to create quiz')
    }
    setIsSubmitting(false)
  }

  const deleteQuiz = async (quizId, quizTitle) => {
    if (!confirm(`Delete "${quizTitle}"? This cannot be undone.`)) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) { setMessage('Quiz deleted successfully!'); fetchQuizzes() }
      else setMessage(data.message || 'Failed to delete quiz')
    } catch (err) { console.error(err); setMessage('Failed to delete quiz') }
  }

  // ─────────────────────────────────────────
  // Question handlers
  // ─────────────────────────────────────────

  const addQuestion = (question) => {
    setNewQuiz(prev => ({ ...prev, questions: [...prev.questions, question] }))
  }

  const removeQuestion = (id) => {
    setNewQuiz(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== id) }))
  }

  // Called by AIGenerator when admin confirms generated questions
  const addAiQuestions = (questions) => {
    setNewQuiz(prev => ({ ...prev, questions: [...prev.questions, ...questions] }))
    setMessage(`✓ ${questions.length} AI questions added! Review them below.`)
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading...</div>
    </div>
  )

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return (
    <div className={styles.container}>
      <div className={`${styles.alert} ${styles.alertError}`}>
        Access denied. Admin privileges required.
      </div>
    </div>
  )

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Admin Panel</h1>
        <div className={styles.headerActions}>
          <span className={styles.userName}>{user.name}</span>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => router.push('/')}>
            Home
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => router.push('/results')}>
            View Results
          </button>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <div className={`${styles.alert} ${
          message.includes('success') || message.includes('✓')
            ? styles.alertSuccess
            : styles.alertError
        }`}>
          {message}
        </div>
      )}

      {/* Quiz metadata form */}
      <CreateQuizForm
        newQuiz={newQuiz}
        onChange={setNewQuiz}
        isSubmitting={isSubmitting}
      />

      {/* AI question generator */}
      <AIGenerator
        onConfirm={addAiQuestions}
        isSubmitting={isSubmitting}
      />

      {/* Manual question editor + save */}
      <QuestionEditor
        questions={newQuiz.questions}
        onAdd={addQuestion}
        onRemove={removeQuestion}
        onSave={saveQuiz}
        isSubmitting={isSubmitting}
      />

      {/* Existing quizzes list */}
      <h2 className={styles.sectionTitle} style={{ marginTop: '8px' }}>
        Existing Quizzes
      </h2>
      <AdminQuizList
        quizzes={quizzes}
        onDelete={deleteQuiz}
        isSubmitting={isSubmitting}
      />

    </div>
  )
}
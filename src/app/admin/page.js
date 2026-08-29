'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'

import CreateQuizForm from '../components/admin/CreateQuizForm'
import AIGenerator from '../components/admin/AIGenerator'
import QuestionEditor from '../components/admin/QuestionEditor'
import AdminQuizList from '../components/admin/AdminQuizList'

export default function Admin() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('manage') // 'manage' | 'create'
  const [creationMethod, setCreationMethod] = useState('ai') // 'ai' | 'manual'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    category: 'General',
    difficulty: 'medium',
    timeLimit: 30,
    timerEnabled: true,
    questions: [],
    isPublic: false,
    passcode: ''
  })

  const [quizzes, setQuizzes] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        router.push('/')
        return
      }
    }
    fetchQuizzes()
  }, [user, loading, router])

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/quizzes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.quizzes)) {
        setQuizzes(data.quizzes)
        if (data.quizzes.length === 0) {
          setActiveTab('create')
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const saveQuiz = async () => {
    if (!newQuiz.title.trim()) {
      alert('Please provide a quiz title')
      return
    }
    if (newQuiz.questions.length === 0) {
      alert('Please add at least one question before publishing the quiz')
      return
    }
    setIsSubmitting(true)
    setMessage('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuiz)
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('✓ Quiz created successfully!')
        setNewQuiz({
          title: '',
          description: '',
          category: 'General',
          difficulty: 'medium',
          timeLimit: 30,
          timerEnabled: true,
          questions: [],
          isPublic: false,
          passcode: ''
        })
        fetchQuizzes()
        setActiveTab('manage')
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
      if (res.ok) {
        setMessage('✓ Quiz deleted successfully!')
        fetchQuizzes()
      } else {
        setMessage(data.message || 'Failed to delete quiz')
      }
    } catch (err) {
      console.error(err)
      setMessage('Failed to delete quiz')
    }
  }

  const addQuestion = (question) => {
    setNewQuiz(prev => ({ ...prev, questions: [...prev.questions, question] }))
    setMessage('✓ Question added to draft!')
  }

  const removeQuestion = (id) => {
    setNewQuiz(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== id) }))
  }

  const addAiQuestions = (questions) => {
    setNewQuiz(prev => ({ ...prev, questions: [...prev.questions, ...questions] }))
    setMessage(`✓ ${questions.length} AI questions added! Review them below.`)
  }

  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)
  const publicQuizzesCount = quizzes.filter(q => q.isPublic).length

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch =
      q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty =
      filterDifficulty === 'all' || q.difficulty === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading Admin Dashboard...</div>
      </div>
    )
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className={styles.container}>
        <div className={`${styles.alert} ${styles.alertError}`}>
          Access denied. Admin privileges required.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>🎓</span>
          <div>
            <h1 className={styles.headerTitle}>IntelliQuiz</h1>
            <span style={{ fontSize: '12px', color: 'var(--primary-300)', fontWeight: 600 }}>Admin Dashboard</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.userName}>{user.name} ({user.role})</span>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => router.push('/')}>
            Home
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => router.push('/results')}>
            📊 Results
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statValue}>{quizzes.length}</div>
          <div className={styles.statLabel}>Total Quizzes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statValue}>{totalQuestions}</div>
          <div className={styles.statLabel}>Total Questions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🌐</div>
          <div className={styles.statValue}>{publicQuizzesCount}</div>
          <div className={styles.statLabel}>Public Quizzes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✨</div>
          <div className={styles.statValue}>{newQuiz.questions.length}</div>
          <div className={styles.statLabel}>Draft Questions</div>
        </div>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.includes('success') || message.includes('✓')
          ? styles.alertSuccess
          : styles.alertError
        }`}>
          {message}
        </div>
      )}

      <div className={styles.adminTabs}>
        <button
          className={`${styles.adminTab} ${activeTab === 'manage' ? styles.adminTabActive : ''}`}
          onClick={() => setActiveTab('manage')}>
          📚 Manage Quizzes ({quizzes.length})
        </button>
        <button
          className={`${styles.adminTab} ${activeTab === 'create' ? styles.adminTabActive : ''}`}
          onClick={() => setActiveTab('create')}>
          ⚡ Create New Quiz {newQuiz.questions.length > 0 && `(${newQuiz.questions.length} draft)`}
        </button>
      </div>

      {activeTab === 'manage' && (
        <div>
          {quizzes.length > 0 && (
            <div className={styles.filterSection}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search quizzes by title or category..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    className={styles.clearSearchBtn}
                    onClick={() => setSearchQuery('')}>
                    ✕
                  </button>
                )}
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Difficulty:</span>
                <select
                  value={filterDifficulty}
                  onChange={e => setFilterDifficulty(e.target.value)}
                  className={styles.filterSelect}>
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          )}

          <AdminQuizList
            quizzes={filteredQuizzes}
            onDelete={deleteQuiz}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {activeTab === 'create' && (
        <div className={styles.createWorkflow}>
          <CreateQuizForm
            newQuiz={newQuiz}
            onChange={setNewQuiz}
            isSubmitting={isSubmitting}
          />

          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              Add Questions to Quiz
            </h3>

            <div className={styles.methodToggle}>
              <button
                type="button"
                className={`${styles.methodBtn} ${creationMethod === 'ai' ? styles.methodBtnActive : ''}`}
                onClick={() => setCreationMethod('ai')}>
                ✨ AI Generator (Prompt & RAG)
              </button>
              <button
                type="button"
                className={`${styles.methodBtn} ${creationMethod === 'manual' ? styles.methodBtnActive : ''}`}
                onClick={() => setCreationMethod('manual')}>
                ✍️ Manual Question Editor
              </button>
            </div>

            {creationMethod === 'ai' && (
              <AIGenerator
                onConfirm={addAiQuestions}
                isSubmitting={isSubmitting}
              />
            )}

            {creationMethod === 'manual' && (
              <QuestionEditor
                questions={newQuiz.questions}
                onAdd={addQuestion}
                onRemove={removeQuestion}
                onSave={saveQuiz}
                isSubmitting={isSubmitting}
              />
            )}
          </div>

          {creationMethod === 'ai' && newQuiz.questions.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>
                Draft Questions Ready for Publishing ({newQuiz.questions.length})
              </h3>
              <div className={styles.optionList}>
                {newQuiz.questions.map((q, idx) => (
                  <div key={q.id || idx} className={styles.questionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className={styles.questionHeader}>Question {idx + 1}</div>
                      <button
                        className={`${styles.btn} ${styles.btnDanger}`}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => removeQuestion(q.id || idx)}>
                        Remove
                      </button>
                    </div>
                    <div className={styles.questionText}>{q.question}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  onClick={saveQuiz}
                  disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing Quiz...' : '✓ Publish Quiz Now'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
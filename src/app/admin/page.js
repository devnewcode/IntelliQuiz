'use client'
import { useState, useEffect, useCallback } from 'react'
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

  const [editingQuizId, setEditingQuizId] = useState(null)
  const [expandedDraftIndex, setExpandedDraftIndex] = useState(null)

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    category: 'General',
    difficulty: 'medium',
    timeLimit: 30,
    timerEnabled: true,
    questions: [],
    isPublic: false,
    quizCode: '',
    passcode: ''
  })

  const [quizzes, setQuizzes] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const fetchQuizzes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/quizzes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.quizzes)) {
        setQuizzes(data.quizzes)
        if (data.quizzes.length === 0 && !editingQuizId) {
          setActiveTab('create')
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [editingQuizId])

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
  }, [user, loading, router, fetchQuizzes])

  const startEditQuiz = (quiz) => {
    setEditingQuizId(quiz._id)
    setNewQuiz({
      title: quiz.title || '',
      description: quiz.description || '',
      category: quiz.category || 'General',
      difficulty: quiz.difficulty || 'medium',
      timeLimit: quiz.timeLimit || 30,
      timerEnabled: quiz.timerEnabled !== false,
      questions: (quiz.questions || []).map((q, idx) => ({
        ...q,
        id: q._id || q.id || String(idx),
        options: q.options || ['', '', '', ''],
        correctAnswer: q.correctAnswer ?? 0,
      })),
      isPublic: quiz.isPublic || false,
      quizCode: quiz.quizCode || '',
      passcode: quiz.passcode || '',
    })
    setActiveTab('create')
    setMessage(`✏️ Editing quiz: "${quiz.title}". Make changes and click "Save Changes" below.`)
  }

  const cancelEdit = () => {
    setEditingQuizId(null)
    setNewQuiz({
      title: '',
      description: '',
      category: 'General',
      difficulty: 'medium',
      timeLimit: 30,
      timerEnabled: true,
      questions: [],
      isPublic: false,
      quizCode: '',
      passcode: ''
    })
    setMessage('')
    setActiveTab('manage')
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
      const url = editingQuizId ? `/api/quizzes/${editingQuizId}` : '/api/quizzes'
      const method = editingQuizId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuiz)
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(editingQuizId ? '✓ Quiz updated successfully!' : '✓ Quiz created successfully!')
        setEditingQuizId(null)
        setNewQuiz({
          title: '',
          description: '',
          category: 'General',
          difficulty: 'medium',
          timeLimit: 30,
          timerEnabled: true,
          questions: [],
          isPublic: false,
          quizCode: '',
          passcode: ''
        })
        fetchQuizzes()
        setActiveTab('manage')
      } else {
        setMessage(data.message || (editingQuizId ? 'Failed to update quiz' : 'Failed to create quiz'))
      }
    } catch {
      setMessage(editingQuizId ? 'Failed to update quiz' : 'Failed to create quiz')
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

  const removeQuestion = (idOrIndex) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((q, idx) => (q.id ? q.id !== idOrIndex : idx !== idOrIndex))
    }))
  }

  const addAiQuestions = (questions) => {
    setNewQuiz(prev => ({ ...prev, questions: [...prev.questions, ...questions] }))
    setMessage(`✓ ${questions.length} AI questions added! Review or edit them below.`)
  }

  const updateDraftQuestion = (index, field, value) => {
    setNewQuiz(prev => {
      const updated = [...prev.questions]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, questions: updated }
    })
  }

  const updateDraftOption = (qIndex, optIndex, value) => {
    setNewQuiz(prev => {
      const updated = [...prev.questions]
      const opts = [...(updated[qIndex].options || ['', '', '', ''])]
      opts[optIndex] = value
      updated[qIndex] = { ...updated[qIndex], options: opts }
      return { ...prev, questions: updated }
    })
  }

  const setDraftCorrectAnswer = (qIndex, correctIndex) => {
    setNewQuiz(prev => {
      const updated = [...prev.questions]
      updated[qIndex] = { ...updated[qIndex], correctAnswer: correctIndex }
      return { ...prev, questions: updated }
    })
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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--grad-primary)',
            color: '#fff'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
            </svg>
          </div>
          <div>
            <h1 className={styles.headerTitle}>IntelliQuiz</h1>
            <span style={{ fontSize: '12px', color: 'var(--primary-300)', fontWeight: 600 }}>Admin Dashboard</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.userName}>{user.name} ({user.role})</span>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => router.push('/')}>
            Home
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => router.push('/multiplayer/host')}>
            Host Live
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => router.push('/results')}>
            Results
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div className={styles.statValue}>{quizzes.length}</div>
          <div className={styles.statLabel}>Total Quizzes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className={styles.statValue}>{totalQuestions}</div>
          <div className={styles.statLabel}>Total Questions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div className={styles.statValue}>{publicQuizzesCount}</div>
          <div className={styles.statLabel}>Public Quizzes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className={styles.statValue}>{newQuiz.questions.length}</div>
          <div className={styles.statLabel}>{editingQuizId ? 'Questions in Quiz' : 'Draft Questions'}</div>
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
          Manage Quizzes ({quizzes.length})
        </button>
        <button
          className={`${styles.adminTab} ${activeTab === 'create' ? styles.adminTabActive : ''}`}
          onClick={() => setActiveTab('create')}>
          {editingQuizId ? 'Edit Quiz' : 'Create New Quiz'} {newQuiz.questions.length > 0 && `(${newQuiz.questions.length})`}
        </button>
      </div>

      {activeTab === 'manage' && (
        <div>
          {quizzes.length > 0 && (
            <div className={styles.filterSection}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
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
            onEdit={startEditQuiz}
            onDelete={deleteQuiz}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {activeTab === 'create' && (
        <div className={styles.createWorkflow}>
          {editingQuizId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px 18px', background: 'var(--purple-12)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <strong>Editing Mode:</strong> You are currently editing an existing quiz.
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={cancelEdit}>
                ✕ Cancel Editing
              </button>
            </div>
          )}

          <CreateQuizForm
            newQuiz={newQuiz}
            onChange={setNewQuiz}
            isSubmitting={isSubmitting}
          />

          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              {editingQuizId ? 'Add / Generate More Questions' : 'Add Questions to Quiz'}
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

          {newQuiz.questions.length > 0 && (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Questions in this Quiz ({newQuiz.questions.length})
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Click a question to inspect & edit options
                </span>
              </div>

              <div className={styles.optionList}>
                {newQuiz.questions.map((q, idx) => {
                  const isExpanded = expandedDraftIndex === idx
                  return (
                    <div key={q.id || idx} className={styles.questionCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                          className={styles.questionHeader}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                          onClick={() => setExpandedDraftIndex(isExpanded ? null : idx)}>
                          <span>{isExpanded ? '▼' : '►'}</span>
                          <span>Question {idx + 1}</span>
                          <span style={{ fontSize: '11px', color: 'var(--success-text)', background: 'var(--success-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                            Correct: Option {(q.correctAnswer ?? 0) + 1}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => setExpandedDraftIndex(isExpanded ? null : idx)}>
                            {isExpanded ? 'Done' : '✏️ Edit'}
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger}`}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => removeQuestion(q.id || idx)}>
                            Remove
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <label className={styles.label} style={{ fontSize: '12px' }}>Question Text</label>
                            <textarea
                              className={styles.textarea}
                              value={q.question}
                              onChange={(e) => updateDraftQuestion(idx, 'question', e.target.value)}
                              rows="2"
                            />
                          </div>

                          <label className={styles.label} style={{ fontSize: '12px' }}>
                            Options (select radio for correct answer)
                          </label>
                          {(q.options || ['', '', '', '']).map((opt, optIdx) => (
                            <div key={optIdx} className={styles.radioGroup}>
                              <input
                                className={styles.input}
                                type="text"
                                value={opt}
                                onChange={(e) => updateDraftOption(idx, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <input
                                className={styles.radioInput}
                                type="radio"
                                name={`draftCorrect_${idx}`}
                                checked={(q.correctAnswer ?? 0) === optIdx}
                                onChange={() => setDraftCorrectAnswer(idx, optIdx)}
                              />
                              <span className={styles.radioLabel}>Correct</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={styles.questionText}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setExpandedDraftIndex(idx)}>
                          {q.question}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  onClick={saveQuiz}
                  disabled={isSubmitting}>
                  {isSubmitting
                    ? (editingQuizId ? 'Saving Changes...' : 'Publishing Quiz...')
                    : (editingQuizId ? '✓ Save Changes to Quiz' : '✓ Publish Quiz Now')}
                </button>
                {editingQuizId && (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}

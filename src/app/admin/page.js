'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'

export default function Admin() {
  const { user, loading } = useAuth()
  const [previewQuizId, setPreviewQuizId] = useState(null) // which quiz is expanded
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

  // ── AI Generator state ──
  const [aiMode, setAiMode] = useState('fields') // 'fields' or 'prompt'
  const [aiFields, setAiFields] = useState({ topic: '', difficulty: 'medium', count: 5 })
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPreview, setAiPreview] = useState([]) // generated questions waiting for confirm
  const [aiError, setAiError] = useState('')

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
    } catch (err) { console.error(err); setMessage('Failed to delete quiz') }
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

  // ── Generate questions with Gemini ──
  const generateQuestions = async () => {
    setAiError('')
    setAiPreview([])

    // Validate
    if (aiMode === 'fields' && !aiFields.topic.trim()) {
      setAiError('Please enter a topic'); return
    }
    if (aiMode === 'prompt' && !aiPrompt.trim()) {
      setAiError('Please enter a prompt'); return
    }

    setIsGenerating(true)
    try {
      const body = aiMode === 'fields'
        ? { topic: aiFields.topic, difficulty: aiFields.difficulty, count: aiFields.count }
        : { prompt: aiPrompt }

      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (res.ok && data.questions) {
        setAiPreview(data.questions)
      } else {
        setAiError(data.message || 'Failed to generate questions')
      }
    } catch {
      setAiError('Something went wrong. Please try again.')
    }
    setIsGenerating(false)
  }

  // ── Confirm: add AI questions to quiz ──
  const confirmAiQuestions = () => {
    const withIds = aiPreview.map(q => ({ ...q, id: Date.now().toString() + Math.random() }))
    setNewQuiz({ ...newQuiz, questions: [...newQuiz.questions, ...withIds] })
    setAiPreview([])
    setAiFields({ topic: '', difficulty: 'medium', count: 5 })
    setAiPrompt('')
    setMessage(`✓ ${withIds.length} AI questions added! Review them below.`)
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
        <div className={`${styles.alert} ${message.includes('success') || message.includes('✓') ? styles.alertSuccess : styles.alertError}`}>
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

      {/* ══════════════════════════════════════════
          AI QUESTION GENERATOR CARD
      ══════════════════════════════════════════ */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>✨ Generate Questions with AI</h3>

        {/* Mode toggle */}
        <div className={styles.aiModeToggle}>
          <button
            className={`${styles.aiModeBtn} ${aiMode === 'fields' ? styles.aiModeBtnActive : ''}`}
            onClick={() => setAiMode('fields')}>
            📋 Topic + Settings
          </button>
          <button
            className={`${styles.aiModeBtn} ${aiMode === 'prompt' ? styles.aiModeBtnActive : ''}`}
            onClick={() => setAiMode('prompt')}>
            💬 Custom Prompt
          </button>
        </div>

        {/* Fields mode */}
        {aiMode === 'fields' && (
          <div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Topic</label>
              <input className={styles.input} type="text"
                value={aiFields.topic}
                onChange={e => setAiFields({ ...aiFields, topic: e.target.value })}
                placeholder="e.g., World War 2, Photosynthesis, Python loops"
                disabled={isGenerating} />
            </div>
            <div className={styles.flexRow}>
              <div className={`${styles.formGroup} ${styles.flexColumn}`}>
                <label className={styles.label}>Difficulty</label>
                <select className={styles.select} value={aiFields.difficulty}
                  onChange={e => setAiFields({ ...aiFields, difficulty: e.target.value })}
                  disabled={isGenerating}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.flexColumn}`}>
                <label className={styles.label}>Number of Questions</label>
                <select className={styles.select} value={aiFields.count}
                  onChange={e => setAiFields({ ...aiFields, count: parseInt(e.target.value) })}
                  disabled={isGenerating}>
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Prompt mode */}
        {aiMode === 'prompt' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Custom Prompt</label>
            <textarea className={styles.textarea} value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g., Generate questions(20 questions will be generated) about the French Revolution focusing on key dates and figures"
              disabled={isGenerating} rows="4" />
            <span className={styles.inputHint}>Be specific — mention topic, difficulty, number of questions, and any focus areas.</span>
          </div>
        )}

        {/* Error */}
        {aiError && (
          <div className={`${styles.alert} ${styles.alertError}`} style={{ marginBottom: '16px' }}>
            {aiError}
          </div>
        )}

        {/* Generate button */}
        <button
          className={`${styles.btn} ${styles.btnAi}`}
          onClick={generateQuestions}
          disabled={isGenerating}>
          {isGenerating ? '✨ Generating...' : '✨ Generate Questions'}
        </button>

        {/* ── AI Preview ── */}
        {aiPreview.length > 0 && (
          <div className={styles.aiPreview}>
            <div className={styles.aiPreviewHeader}>
              <div>
                <div className={styles.aiPreviewTitle}>✨ AI Generated — Review before adding</div>
                <div className={styles.aiPreviewSubtitle}>{aiPreview.length} questions generated</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={confirmAiQuestions}>
                  ✓ Add All to Quiz
                </button>
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setAiPreview([])}>
                  ✕ Discard
                </button>
              </div>
            </div>

            {aiPreview.map((q, i) => (
              <div key={i} className={styles.aiPreviewCard}>
                <div className={styles.questionHeader}>Question {i + 1}</div>
                <div className={styles.questionText}>{q.question}</div>
                <div className={styles.optionList}>
                  {q.options.map((opt, j) => (
                    <div key={j} className={`${styles.optionItem} ${q.correctAnswer === j ? styles.correctOption : ''}`}>
                      {j + 1}. {opt}{q.correctAnswer === j && ' ✓'}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={confirmAiQuestions}>
                ✓ Add All to Quiz
              </button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setAiPreview([])}>
                ✕ Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Question Manually Card ── */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>Add Question Manually</h3>

        <div className={styles.formGroup}>
          <label className={styles.label}>Question</label>
          <textarea className={styles.textarea} value={currentQuestion.question}
            onChange={e => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
            placeholder="Enter your question here..."
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
        {/* ── PREVIEW BUTTON — toggles inline panel ── */}
        <button className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => setPreviewQuizId(previewQuizId === quiz._id ? null : quiz._id)}>
          {previewQuizId === quiz._id ? 'Hide Questions' : 'Preview Questions'}
        </button>
      </div>

      {/* ── INLINE QUESTIONS PANEL ── */}
      {previewQuizId === quiz._id && (
        <div className={styles.questionsSummary} style={{ marginTop: '20px' }}>
          <h3 className={styles.summaryTitle}>
            {quiz.questions.length} Question{quiz.questions.length !== 1 ? 's' : ''}
          </h3>
          {quiz.questions.map((q, i) => (
            <div key={q._id || i} className={styles.questionCard}>
              <div className={styles.questionHeader}>Question {i + 1}</div>
              <div className={styles.questionText}>{q.question}</div>
              <div className={styles.optionList}>
                {q.options.map((opt, j) => (
                  <div key={j} className={`${styles.optionItem} ${q.correctAnswer === j ? styles.correctOption : ''}`}>
                    {j + 1}. {opt}{q.correctAnswer === j && ' ✓'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  ))
)}
    </div>
  )
}
'use client'
import { useState } from 'react'
import styles from '../../admin/page.module.css'
import RagPipelineViewer from './RagPipelineViewer'

// Toggle RAG pipeline visualization
const SHOW_RAG_VIEWER = true

export default function AIGenerator({ onConfirm, isSubmitting }) {
  const [aiMode, setAiMode] = useState('fields')
  const [aiFields, setAiFields] = useState({ topic: '', difficulty: 'medium', count: 5 })
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPreview, setAiPreview] = useState([])
  const [aiError, setAiError] = useState('')

  const [docFile, setDocFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [sourceDocument, setSourceDocument] = useState(null)
  const [docPrompt, setDocPrompt] = useState('')
  const [ragStage, setRagStage] = useState('idle') // idle | uploading | uploaded | generating | done
  const [ragStats, setRagStats] = useState({ totalChunks: 0, retrievedChunks: 0 })

  const clearDocuments = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/documents/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch {
      // best-effort cleanup
    }
  }

  const switchToDocumentMode = () => {
    setAiMode('document')
    setSourceDocument(null)
    setDocPrompt('')
    setRagStage('idle')
    setRagStats({ totalChunks: 0, retrievedChunks: 0 })
    clearDocuments()
  }

  const uploadDocument = async () => {
    if (!docFile) {
      setUploadError('Please choose a PDF or DOCX file first'); return
    }

    setUploadError('')
    setSourceDocument(null)
    setIsUploading(true)
    setRagStage('uploading')

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', docFile)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSourceDocument(data.sourceDocument)
        setRagStats((s) => ({ ...s, totalChunks: data.sourceDocument.chunkCount }))
        setRagStage('uploaded')
      } else {
        setUploadError(data.message || 'Failed to upload document')
        setRagStage('idle')
      }
    } catch {
      setUploadError('Something went wrong while uploading. Please try again.')
      setRagStage('idle')
    }

    setIsUploading(false)
  }

  const generateQuestions = async () => {
    setAiError('')
    setAiPreview([])

    if (aiMode === 'fields' && !aiFields.topic.trim()) {
      setAiError('Please enter a topic'); return
    }

    if (aiMode === 'prompt' && !aiPrompt.trim()) {
      setAiError('Please enter a prompt'); return
    }

    if (aiMode === 'document' && !sourceDocument) {
      setAiError('Please upload a document first'); return
    }

    if (aiMode === 'document' && !docPrompt.trim()) {
      setAiError('Describe what questions you want from this document'); return
    }

    setIsGenerating(true)

    if (aiMode === 'document') setRagStage('generating')

    try {
      const body = aiMode === 'fields'
        ? { topic: aiFields.topic, difficulty: aiFields.difficulty, count: aiFields.count }
        : aiMode === 'prompt'
        ? { prompt: aiPrompt }
        : { sourceDocumentId: sourceDocument.id, prompt: docPrompt }

      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (res.ok && data.questions) {
        setAiPreview(data.questions)

        if (data.rag) {
          setRagStats((s) => ({ ...s, retrievedChunks: data.rag.retrievedChunks }))
          setRagStage('done')
        }
      } else {
        setAiError(data.message || 'Failed to generate questions')

        if (aiMode === 'document') setRagStage('uploaded')
      }
    } catch {
      setAiError('Something went wrong. Please try again.')

      if (aiMode === 'document') setRagStage('uploaded')
    }

    setIsGenerating(false)
  }

  const confirmAiQuestions = () => {
    const withIds = aiPreview.map(q => ({
      ...q,
      id: Date.now().toString() + Math.random()
    }))

    onConfirm(withIds)
    setAiPreview([])
    setAiFields({ topic: '', difficulty: 'medium', count: 5 })
    setAiPrompt('')

    if (aiMode === 'document') {
      clearDocuments()
      setSourceDocument(null)
      setDocPrompt('')
      setRagStage('idle')
      setRagStats({ totalChunks: 0, retrievedChunks: 0 })
    }
  }

  const ragSteps = [
    {
      label: sourceDocument ? `"${sourceDocument.fileName}" uploaded` : 'Document uploaded',
      status: ragStage === 'uploading' ? 'active' : ragStage === 'idle' ? 'pending' : 'done'
    },
    {
      label: `${ragStats.totalChunks} chunks created & embedded`,
      status: ragStage === 'uploading' ? 'active' : ragStage === 'idle' ? 'pending' : 'done'
    },
    {
      label: 'Searching relevant content...',
      status: ragStage === 'generating' ? 'active' : ragStage === 'done' ? 'done' : 'pending'
    },
    {
      label: `${ragStats.retrievedChunks} relevant chunks retrieved`,
      status: ragStage === 'done' ? 'done' : 'pending'
    },
    {
      label: 'Generating grounded questions...',
      status: ragStage === 'generating' ? 'active' : ragStage === 'done' ? 'done' : 'pending'
    },
    {
      label: 'Quiz generated',
      status: ragStage === 'done' ? 'done' : 'pending'
    }
  ]

  return (
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

        <button
          className={`${styles.aiModeBtn} ${aiMode === 'document' ? styles.aiModeBtnActive : ''}`}
          onClick={switchToDocumentMode}>
          📄 From Document
        </button>
      </div>

      {/* Fields mode */}
      {aiMode === 'fields' && (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Topic</label>
            <input
              className={styles.input}
              type="text"
              value={aiFields.topic}
              onChange={e => setAiFields({ ...aiFields, topic: e.target.value })}
              placeholder="e.g., World War 2, Photosynthesis, Python loops"
              disabled={isGenerating} />
          </div>

          <div className={styles.flexRow}>
            <div className={`${styles.formGroup} ${styles.flexColumn}`}>
              <label className={styles.label}>Difficulty</label>
              <select
                className={styles.select}
                value={aiFields.difficulty}
                onChange={e => setAiFields({ ...aiFields, difficulty: e.target.value })}
                disabled={isGenerating}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.flexColumn}`}>
              <label className={styles.label}>Number of Questions</label>
              <select
                className={styles.select}
                value={aiFields.count}
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

          <textarea
            className={styles.textarea}
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="e.g., Generate 10 hard questions about React hooks, useState and useEffect with real-world examples"
            disabled={isGenerating}
            rows="4" />

          <span className={styles.inputHint}>
            Be specific — mention topic, difficulty, number of questions, and any focus areas.
          </span>
        </div>
      )}

      {/* Document mode */}
      {aiMode === 'document' && (
        <div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Upload a PDF or DOCX file</label>

            <input
              type="file"
              accept=".pdf,.docx"
              onChange={e => setDocFile(e.target.files?.[0] || null)}
              disabled={isUploading}
              style={{ marginBottom: '10px' }} />

            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={uploadDocument}
              disabled={isUploading || !docFile}
              type="button">
              {isUploading ? 'Uploading & processing...' : 'Upload Document'}
            </button>
          </div>

          {uploadError && (
            <div className={`${styles.alert} ${styles.alertError}`} style={{ marginBottom: '16px' }}>
              {uploadError}
            </div>
          )}

          {/* Shows the RAG pipeline progress during document generation */}
          {SHOW_RAG_VIEWER && ragStage !== 'idle' && (
            <RagPipelineViewer steps={ragSteps} />
          )}

          {sourceDocument && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                What questions do you want from this document?
              </label>

              <textarea
                className={styles.textarea}
                value={docPrompt}
                onChange={e => setDocPrompt(e.target.value)}
                placeholder="e.g., Generate 5 hard questions about the chapter on photosynthesis"
                disabled={isGenerating}
                rows="4" />

              <span className={styles.inputHint}>
                Mention topic/section, difficulty, and number of questions.
              </span>
            </div>
          )}
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
        disabled={isGenerating || isSubmitting}>
        {isGenerating ? '✨ Generating...' : '✨ Generate Questions'}
      </button>

      {/* AI Preview - review questions before adding them to the quiz */}
      {aiPreview.length > 0 && (
        <div className={styles.aiPreview}>
          <div className={styles.aiPreviewHeader}>
            <div>
              <div className={styles.aiPreviewTitle}>
                ✨ AI Generated — Review before adding
              </div>
              <div className={styles.aiPreviewSubtitle}>
                {aiPreview.length} questions generated
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className={`${styles.btn} ${styles.btnSuccess}`}
                onClick={confirmAiQuestions}>
                ✓ Add All to Quiz
              </button>

              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => setAiPreview([])}>
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
                  <div
                    key={j}
                    className={`${styles.optionItem} ${q.correctAnswer === j ? styles.correctOption : ''}`}>
                    {j + 1}. {opt}{q.correctAnswer === j && ' ✓'}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              className={`${styles.btn} ${styles.btnSuccess}`}
              onClick={confirmAiQuestions}>
              ✓ Add All to Quiz
            </button>

            <button
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => setAiPreview([])}>
              ✕ Discard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
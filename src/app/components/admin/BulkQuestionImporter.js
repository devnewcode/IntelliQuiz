'use client'
import { useState, useRef } from 'react'
import styles from '../../admin/page.module.css'

export default function BulkQuestionImporter({ onConfirm, isSubmitting }) {
  const [rawText, setRawText] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState([])
  const [selectedIndices, setSelectedIndices] = useState(new Set())
  const [parseErrors, setParseErrors] = useState([])
  const [copyStatus, setCopyStatus] = useState(false)
  const [showFormatGuide, setShowFormatGuide] = useState(false)
  const [previewLayout, setPreviewLayout] = useState('list')
  const [editingIndex, setEditingIndex] = useState(null)
  const fileInputRef = useRef(null)

  const AI_PROMPT_TEMPLATE = `Please generate 20 high-quality multiple-choice questions from the content below.

Format each question strictly as follows:
Q: [Question text here]
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
Answer: [A, B, C, or D]

(Leave an empty line between each question)

Content:
[Paste your chapter / PDF text here]`

  const SAMPLE_QUESTIONS = `Q: What is the primary function of mitochondria in eukaryotic cells?
A) Protein synthesis
B) ATP / Cellular energy production
C) Photosynthesis
D) Packaging lipids
Answer: B

Q: Which HTTP status code represents a successful resource creation?
A) 200 OK
B) 201 Created
C) 204 No Content
D) 400 Bad Request
Answer: B

Q: In React, which hook is used to perform side effects in functional components?
A) useState
B) useContext
C) useEffect
D) useReducer
Answer: C`

  const handleCopyPrompt = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(AI_PROMPT_TEMPLATE)
      setCopyStatus(true)
      setTimeout(() => setCopyStatus(false), 2500)
    }
  }

  const handleLoadSample = () => {
    setRawText(SAMPLE_QUESTIONS)
    runParser(SAMPLE_QUESTIONS)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setRawText(content)
        runParser(content)
      }
    }
    reader.readAsText(file)
  }

  const runParser = (textToParse = rawText) => {
    if (!textToParse.trim()) {
      setParsedQuestions([])
      setSelectedIndices(new Set())
      setParseErrors([])
      return
    }

    const { questions, errors } = parseQuestionsText(textToParse)
    setParsedQuestions(questions)
    setSelectedIndices(new Set(questions.map((_, i) => i)))
    setParseErrors(errors)
  }

  const handleClear = () => {
    setRawText('')
    setParsedQuestions([])
    setSelectedIndices(new Set())
    setParseErrors([])
    setEditingIndex(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDiscardPreview = () => {
    setParsedQuestions([])
    setSelectedIndices(new Set())
    setParseErrors([])
    setEditingIndex(null)
  }

  const toggleSelectAll = () => {
    if (selectedIndices.size === parsedQuestions.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(parsedQuestions.map((_, i) => i)))
    }
  }

  const toggleSelectOne = (index) => {
    setSelectedIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleDeletePreviewItem = (index) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setEditingIndex(null)
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1)
    }
    setSelectedIndices(prev => {
      const next = new Set()
      for (const i of prev) {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      }
      return next
    })
  }

  const updatePreviewQuestionText = (index, value) => {
    setParsedQuestions(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], question: value }
      return updated
    })
  }

  const updatePreviewOptionText = (qIndex, optIndex, value) => {
    setParsedQuestions(prev => {
      const updated = [...prev]
      const opts = [...(updated[qIndex].options || ['', '', '', ''])]
      opts[optIndex] = value
      updated[qIndex] = { ...updated[qIndex], options: opts }
      return updated
    })
  }

  const setPreviewCorrectAnswer = (qIndex, correctIndex) => {
    setParsedQuestions(prev => {
      const updated = [...prev]
      updated[qIndex] = { ...updated[qIndex], correctAnswer: correctIndex }
      return updated
    })
  }

  const handleAddSelectedToQuiz = () => {
    const selected = parsedQuestions.filter((_, i) => selectedIndices.has(i))
    if (selected.length === 0) return
    onConfirm(selected)
    handleClear()
  }

  return (
    <div className={styles.card} style={{ marginTop: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 className={styles.sectionTitle} style={{ margin: '0 0 6px', borderBottom: 'none', paddingBottom: 0 }}>
            Bulk Paste & Import Questions
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Paste 20+ questions from ChatGPT, Claude, textbooks, or notes. They will be automatically parsed into IntelliQuiz&apos;s schema.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ fontSize: '12.5px', padding: '6px 12px' }}
            onClick={handleCopyPrompt}>
            {copyStatus ? 'Prompt Copied' : 'Copy AI Prompt Template'}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ fontSize: '12.5px', padding: '6px 12px' }}
            onClick={() => setShowFormatGuide(!showFormatGuide)}>
            {showFormatGuide ? 'Hide Format Guide' : 'Show Format Guide'}
          </button>
        </div>
      </div>

      {showFormatGuide && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '18px',
          fontSize: '13px',
          lineHeight: 1.6
        }}>
          <div style={{ fontWeight: 700, color: 'var(--primary-300)', marginBottom: '8px', fontSize: '14px' }}>
            Accepted Question Format:
          </div>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            color: '#e2e8f0',
            fontFamily: 'monospace',
            fontSize: '12px',
            overflowX: 'auto',
            margin: '0 0 10px'
          }}>
{`Q: What is the capital of France?
A) Berlin
B) Madrid
C) Paris
D) Rome
Answer: C

1. Which language is used for styling web pages?
A. HTML
B. CSS
C. Python
D. SQL
Ans: B`}
          </pre>
          <ul style={{ margin: '0 0 10px', paddingLeft: '18px', color: 'var(--text-secondary)' }}>
            <li>Question numbers can be <strong>Q:</strong>, <strong>Q1:</strong>, <strong>1.</strong>, or <strong>1)</strong>.</li>
            <li>Options can be <strong>A)</strong>, <strong>B)</strong>, <strong>C)</strong>, <strong>D)</strong> or <strong>A.</strong>, <strong>B.</strong>, etc.</li>
            <li>The answer line can be <strong>Answer: C</strong>, <strong>Ans: C</strong>, or the full option text.</li>
            <li>Separate each question with an empty line. You can also paste raw <strong>JSON</strong>!</li>
          </ul>
        </div>
      )}

      <div className={styles.formGroup}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <label className={styles.label} style={{ margin: 0 }}>
            Paste Questions Text
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleLoadSample}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-400)',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}>
              Load Sample Questions
            </button>
            <span style={{ color: 'var(--border-default)', fontSize: '12px' }}>|</span>
            <label style={{
              cursor: 'pointer',
              color: 'var(--primary-400)',
              fontSize: '12px',
              textDecoration: 'underline'
            }}>
              Upload File (.txt, .md, .json)
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        <textarea
          className={styles.textarea}
          style={{
            minHeight: '220px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '13px',
            lineHeight: 1.5,
            padding: '14px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)'
          }}
          placeholder={`Paste your questions here...\n\nExample:\nQ: What is the capital of France?\nA) Berlin\nB) Madrid\nC) Paris\nD) Rome\nAnswer: C`}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={isSubmitting}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <span>{rawText.trim() ? `${rawText.split('\n').length} lines pasted` : 'Ready to paste questions'}</span>
          <span>Tip: Click &quot;Copy AI Prompt Template&quot; above to generate questions from ChatGPT</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => runParser(rawText)}
          disabled={isSubmitting || !rawText.trim()}>
          Parse & Preview Questions
        </button>
        {rawText && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleClear}
            disabled={isSubmitting}>
            Clear Text
          </button>
        )}
      </div>

      {parseErrors.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: '#fca5a5',
          fontSize: '12.5px'
        }}>
          <strong>Parsing Notes / Warnings:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
            {parseErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {parsedQuestions.length > 0 && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-default)' }}>
          
          <div className={styles.previewStickyHeader}>
            <div className={styles.previewHeaderLeft}>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>
                Parsed Questions ({parsedQuestions.length})
              </h4>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '12px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={parsedQuestions.length > 0 && selectedIndices.size === parsedQuestions.length}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
                <span>Select All ({selectedIndices.size}/{parsedQuestions.length})</span>
              </label>

              <div className={styles.previewLayoutToggle} title="Switch options layout">
                <button
                  type="button"
                  className={`${styles.previewLayoutBtn} ${previewLayout === 'list' ? styles.previewLayoutBtnActive : ''}`}
                  onClick={() => setPreviewLayout('list')}>
                  Full Width
                </button>
                <button
                  type="button"
                  className={`${styles.previewLayoutBtn} ${previewLayout === 'grid' ? styles.previewLayoutBtnActive : ''}`}
                  onClick={() => setPreviewLayout('grid')}>
                  2x2 Grid
                </button>
              </div>
            </div>

            <div className={styles.previewHeaderActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={handleDiscardPreview}
                disabled={isSubmitting}>
                Discard
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSuccess}`}
                style={{ padding: '6px 16px', fontSize: '12.5px', fontWeight: 700 }}
                onClick={handleAddSelectedToQuiz}
                disabled={isSubmitting || selectedIndices.size === 0}>
                Add to Quiz ({selectedIndices.size})
              </button>
            </div>
          </div>

          <div className={styles.previewScrollContainer}>
            {parsedQuestions.map((q, idx) => {
              const isEditing = editingIndex === idx
              return (
                <div key={q.id || idx} className={styles.previewQuestionCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(idx)}
                        onChange={() => toggleSelectOne(idx)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        title="Include this question"
                      />
                      <span className={styles.previewQuestionNumber}>Question {idx + 1}</span>
                      <span style={{ fontSize: '11px', color: 'var(--success-text)', background: 'var(--success-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                        Correct: Option {['A', 'B', 'C', 'D'][q.correctAnswer ?? 0] || (q.correctAnswer ?? 0) + 1}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className={`${styles.btn} ${isEditing ? styles.btnPrimary : styles.btnSecondary}`}
                        style={{ padding: '3px 10px', fontSize: '11px' }}
                        onClick={() => setEditingIndex(isEditing ? null : idx)}>
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger}`}
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => handleDeletePreviewItem(idx)}>
                        Remove
                      </button>
                    </div>
                  </div>

                  {!isEditing && (
                    <div
                      className={styles.previewQuestionTitle}
                      style={{ margin: '6px 0 12px', cursor: 'pointer', width: '100%', lineHeight: 1.5 }}
                      title="Click to edit question text or options"
                      onClick={() => setEditingIndex(idx)}>
                      {q.question}
                    </div>
                  )}

                  {isEditing ? (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label className={styles.label} style={{ fontSize: '12px', marginBottom: '4px' }}>
                          Question Text
                        </label>
                        <textarea
                          className={styles.textarea}
                          value={q.question}
                          onChange={(e) => updatePreviewQuestionText(idx, e.target.value)}
                          rows="2"
                          placeholder="Edit question text..."
                        />
                      </div>

                      <div>
                        <label className={styles.label} style={{ fontSize: '12px', marginBottom: '6px' }}>
                          Options (Select radio for correct answer)
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(q.options || ['', '', '', '']).map((opt, optIdx) => (
                            <div key={optIdx} className={styles.radioGroup}>
                              <span style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: (q.correctAnswer ?? 0) === optIdx ? '#10b981' : 'rgba(255,255,255,0.08)',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}
                              </span>
                              <input
                                className={styles.input}
                                type="text"
                                value={opt}
                                onChange={(e) => updatePreviewOptionText(idx, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <input
                                className={styles.radioInput}
                                type="radio"
                                name={`previewCorrect_${idx}`}
                                checked={(q.correctAnswer ?? 0) === optIdx}
                                onChange={() => setPreviewCorrectAnswer(idx, optIdx)}
                                title="Mark as correct answer"
                              />
                              <span
                                className={styles.radioLabel}
                                style={{
                                  color: (q.correctAnswer ?? 0) === optIdx ? '#34d399' : 'var(--text-muted)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setPreviewCorrectAnswer(idx, optIdx)}>
                                {(q.correctAnswer ?? 0) === optIdx ? 'Correct' : 'Mark Correct'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          style={{ padding: '4px 14px', fontSize: '12px' }}
                          onClick={() => setEditingIndex(null)}>
                          Save & Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    
                    <div className={previewLayout === 'list' ? styles.previewOptionsList : styles.previewOptionsGrid2Col}>
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswer === optIdx
                        const letter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1)
                        return (
                          <div
                            key={optIdx}
                            className={`${styles.previewOption} ${isCorrect ? styles.previewOptionCorrect : ''}`}
                            style={{ cursor: 'pointer' }}
                            title="Click option to mark as correct, or click Edit to modify text"
                            onClick={() => setPreviewCorrectAnswer(idx, optIdx)}>
                            <span className={styles.previewOptionLetter}>{letter}</span>
                            <span style={{ flex: 1, lineHeight: 1.5 }}>{opt}</span>
                            {isCorrect && (
                              <span className={styles.previewCorrectBadge}>
                                Correct
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className={styles.previewBottomBar}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>
              Showing {parsedQuestions.length} questions ({selectedIndices.size} selected)
            </span>
            <div className={styles.previewBottomActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={handleDiscardPreview}
                disabled={isSubmitting}>
                Discard
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSuccess}`}
                onClick={handleAddSelectedToQuiz}
                disabled={isSubmitting || selectedIndices.size === 0}>
                Add to Quiz ({selectedIndices.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function parseQuestionsText(input) {
  if (!input || !input.trim()) {
    return { questions: [], errors: [] }
  }

  const trimmed = input.trim()

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsedJson = JSON.parse(trimmed)
      if (Array.isArray(parsedJson)) {
        const validated = parsedJson.map((q, idx) => {
          let opts = Array.isArray(q.options) ? q.options.map(String) : []
          let corr = 0
          if (typeof q.correctAnswer === 'number') {
            corr = Math.max(0, Math.min(opts.length - 1, q.correctAnswer))
          } else if (typeof q.correctAnswer === 'string') {
            const letter = q.correctAnswer.trim().toUpperCase()
            if (['A', 'B', 'C', 'D'].includes(letter)) {
              corr = { A: 0, B: 1, C: 2, D: 3 }[letter]
            } else {
              const matchedIdx = opts.findIndex(o => o.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim())
              corr = matchedIdx >= 0 ? matchedIdx : 0
            }
          }
          return {
            id: Date.now().toString() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5),
            question: q.question || `Question ${idx + 1}`,
            options: opts.length ? opts : ['', '', '', ''],
            correctAnswer: corr
          }
        })
        return { questions: validated, errors: [] }
      }
    } catch {
      
    }
  }

  const normalized = trimmed.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  let rawBlocks = normalized.split(/\n\s*\n+/).filter(b => b.trim().length > 0)

  if (rawBlocks.length === 1) {
    const lines = normalized.split('\n')
    const splitIndices = []
    lines.forEach((line, i) => {
      const t = line.trim()
      if (/^(?:Q\d*[:.]|\d+[\.)]|\#{1,4}\s*\d+[\.)]|\#{1,4}\s*Q\d*[:.])/i.test(t)) {
        splitIndices.push(i)
      }
    })

    if (splitIndices.length > 1) {
      rawBlocks = []
      for (let s = 0; s < splitIndices.length; s++) {
        const start = splitIndices[s]
        const end = s + 1 < splitIndices.length ? splitIndices[s + 1] : lines.length
        rawBlocks.push(lines.slice(start, end).join('\n'))
      }
    }
  }

  const questions = []
  const errors = []

  rawBlocks.forEach((block, bIdx) => {
    const rawLines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (rawLines.length === 0) return

    let questionText = ''
    const options = []
    let answerIndicator = null

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i]
      
      line = line.replace(/^\*\*([\s\S]*?)\*\*$/, '$1').replace(/^__([\s\S]*?)__$/, '$1')

      const ansMatch = line.match(/^(?:\*{0,2}(?:Answer|Ans|Correct(?:\s*Answer)?)\*{0,2}\s*[:=\-]\s*|\(?Correct\)?\s*[:=\-]\s*)(.*)$/i)
      if (ansMatch) {
        answerIndicator = ansMatch[1].replace(/[\*\_\(\)]/g, '').trim()
        continue
      }

      const optMatch = line.match(/^(?:[-*•]\s*)?(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d1-4])[\.\)])\s*(.*)$/)
      if (optMatch && questionText) {
        const optLetter = (optMatch[1] || optMatch[2] || optMatch[3]).toUpperCase()
        const optText = optMatch[4].trim()
        options.push({ letter: optLetter, text: optText })
        continue
      }

      if (!questionText) {
        
        const qCleaned = line
          .replace(/^#+\s*/, '')
          .replace(/^(?:Q\d*[:.]|\d+[\.\)]|\(\d+\))\s*/i, '')
          .trim()
        questionText = qCleaned || line
        continue
      }

      if (options.length === 0 && !answerIndicator) {
        questionText += '\n' + line
      } else if (options.length > 0 && !answerIndicator) {
        options[options.length - 1].text += ' ' + line
      }
    }

    if (!questionText && options.length === 0) return

    const blockNum = bIdx + 1
    const finalOptions = options.map(o => o.text)

    let correctIdx = 0
    if (answerIndicator) {
      const upperAns = answerIndicator.toUpperCase()
      const letterMatch = upperAns.match(/^[A-D]/)
      if (letterMatch) {
        correctIdx = { A: 0, B: 1, C: 2, D: 3 }[letterMatch[0]] ?? 0
      } else if (/^[1-4]$/.test(upperAns)) {
        correctIdx = parseInt(upperAns, 10) - 1
      } else {
        
        const matchIdx = finalOptions.findIndex(o =>
          o.toLowerCase().trim() === answerIndicator.toLowerCase().trim() ||
          answerIndicator.toLowerCase().includes(o.toLowerCase().trim())
        )
        if (matchIdx >= 0) {
          correctIdx = matchIdx
        }
      }
    }

    if (!questionText) {
      errors.push(`Item #${blockNum}: Question title could not be found.`)
    } else if (finalOptions.length < 2) {
      errors.push(`Item #${blockNum} ("${questionText.slice(0, 30)}..."): Found only ${finalOptions.length} option(s). At least 2 options are required.`)
    } else if (answerIndicator === null) {
      errors.push(`Item #${blockNum} ("${questionText.slice(0, 30)}..."): Missing "Answer:" line (defaulted to Option A).`)
    }

    if (questionText && finalOptions.length >= 2) {
      
      while (finalOptions.length < 4) {
        finalOptions.push(`Option ${finalOptions.length + 1}`)
      }

      if (correctIdx >= finalOptions.length || correctIdx < 0) {
        correctIdx = 0
      }

      questions.push({
        id: Date.now().toString() + '_' + bIdx + '_' + Math.random().toString(36).substr(2, 5),
        question: questionText,
        options: finalOptions.slice(0, 4),
        correctAnswer: correctIdx
      })
    }
  })

  return { questions, errors }
}


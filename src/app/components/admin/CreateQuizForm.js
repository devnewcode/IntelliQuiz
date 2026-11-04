'use client'
import { useState } from 'react'
import styles from '../../admin/page.module.css'

export default function CreateQuizForm({ newQuiz, onChange, isSubmitting }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleGenerateCode = () => {
    onChange({
      ...newQuiz,
      quizCode: Math.random().toString(36).substring(2, 8).toUpperCase()
    })
  }

  return (
    <div className={styles.card} style={{ padding: '16px 20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : '14px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 className={styles.sectionTitle} style={{ margin: 0, paddingBottom: 0, borderBottom: 'none', fontSize: '16px' }}>
          {newQuiz.title ? `Quiz: ${newQuiz.title}` : 'Create New Quiz'}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
            onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? 'Show Details' : 'Minimize'}
          </button>
        </div>
      </div>

      {isCollapsed ? (
        <div
          onClick={() => setIsCollapsed(false)}
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {newQuiz.title || 'Untitled Quiz'}
            </span>
            <span style={{ color: 'var(--border-default)' }}>|</span>
            <span>Category: {newQuiz.category || 'General'}</span>
            <span style={{ color: 'var(--border-default)' }}>|</span>
            <span style={{ textTransform: 'capitalize' }}>{newQuiz.difficulty}</span>
            <span style={{ color: 'var(--border-default)' }}>|</span>
            <span>{newQuiz.timerEnabled ? `${newQuiz.timeLimit} mins` : 'No Timer'}</span>
            <span style={{ color: 'var(--border-default)' }}>|</span>
            <span>{newQuiz.isPublic ? 'Public' : 'Private'}</span>
            {newQuiz.quizCode && <span>(Code: {newQuiz.quizCode})</span>}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--primary-400)', textDecoration: 'underline' }}>
            Click to edit
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.label} style={{ fontSize: '11.5px', margin: 0 }}>
                Quiz Title
              </label>
              <input
                className={styles.input}
                style={{ padding: '8px 12px', fontSize: '13px' }}
                type="text"
                value={newQuiz.title}
                onChange={e => onChange({ ...newQuiz, title: e.target.value })}
                placeholder="Enter quiz title"
                disabled={isSubmitting}
              />
            </div>

            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.label} style={{ fontSize: '11.5px', margin: 0 }}>
                Category
              </label>
              <input
                className={styles.input}
                style={{ padding: '8px 12px', fontSize: '13px' }}
                type="text"
                value={newQuiz.category}
                onChange={e => onChange({ ...newQuiz, category: e.target.value })}
                placeholder="e.g. Science, Math"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className={styles.label} style={{ fontSize: '11.5px', margin: 0 }}>
              Description
            </label>
            <textarea
              className={styles.textarea}
              style={{ minHeight: '44px', padding: '8px 12px', fontSize: '12.5px', lineHeight: 1.4 }}
              value={newQuiz.description}
              onChange={e => onChange({ ...newQuiz, description: e.target.value })}
              placeholder="Brief description about this quiz..."
              rows="1"
              disabled={isSubmitting}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            alignItems: 'end',
            padding: '10px 12px',
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.label} style={{ fontSize: '11px', margin: 0 }}>
                Difficulty
              </label>
              <select
                className={styles.select}
                style={{ padding: '7px 10px', fontSize: '12.5px' }}
                value={newQuiz.difficulty}
                onChange={e => onChange({ ...newQuiz, difficulty: e.target.value })}
                disabled={isSubmitting}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.label} style={{ fontSize: '11px', margin: 0 }}>
                Timer Limit
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={newQuiz.timerEnabled}
                    onChange={e => onChange({ ...newQuiz, timerEnabled: e.target.checked })}
                    disabled={isSubmitting}
                  />
                  <span>Timer</span>
                </label>
                {newQuiz.timerEnabled && (
                  <input
                    className={styles.input}
                    type="number"
                    style={{ padding: '6px 8px', fontSize: '12px', width: '70px' }}
                    value={newQuiz.timeLimit}
                    onChange={e => onChange({ ...newQuiz, timeLimit: parseInt(e.target.value) || 30 })}
                    min="1"
                    max="300"
                    placeholder="30m"
                    disabled={isSubmitting}
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.label} style={{ fontSize: '11px', margin: 0 }}>
                Access Mode
              </label>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-xs)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: !newQuiz.isPublic ? 700 : 500,
                    background: !newQuiz.isPublic ? 'var(--primary-600)' : 'transparent',
                    color: !newQuiz.isPublic ? '#fff' : 'var(--text-dim)',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer'
                  }}
                  onClick={() => onChange({ ...newQuiz, isPublic: false })}>
                  Private
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: newQuiz.isPublic ? 700 : 500,
                    background: newQuiz.isPublic ? 'var(--primary-600)' : 'transparent',
                    color: newQuiz.isPublic ? '#fff' : 'var(--text-dim)',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer'
                  }}
                  onClick={() => onChange({ ...newQuiz, isPublic: true })}>
                  Public
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.label} style={{ fontSize: '11px', margin: 0 }}>
                Quiz Code
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  className={styles.input}
                  style={{ padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 700 }}
                  type="text"
                  value={newQuiz.quizCode || ''}
                  onChange={e => onChange({ ...newQuiz, quizCode: e.target.value.toUpperCase() })}
                  placeholder="CODE"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                  onClick={handleGenerateCode}>
                  Auto
                </button>
              </div>
            </div>

            {newQuiz.isPublic && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className={styles.label} style={{ fontSize: '11px', margin: 0 }}>
                  Passcode (Optional)
                </label>
                <input
                  className={styles.input}
                  style={{ padding: '6px 8px', fontSize: '12px' }}
                  type="text"
                  value={newQuiz.passcode || ''}
                  onChange={e => onChange({ ...newQuiz, passcode: e.target.value })}
                  placeholder="Optional"
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

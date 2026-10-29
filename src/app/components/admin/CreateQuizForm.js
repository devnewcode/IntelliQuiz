'use client'
import styles from '../../admin/page.module.css'

export default function CreateQuizForm({ newQuiz, onChange, isSubmitting }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Create New Quiz</h2>

      <div className={styles.formGroup}>
        <label className={styles.label}>Quiz Title</label>
        <input
          className={styles.input}
          type="text"
          value={newQuiz.title}
          onChange={e => onChange({ ...newQuiz, title: e.target.value })}
          placeholder="Enter quiz title"
          disabled={isSubmitting} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Description</label>
        <textarea
          className={styles.textarea}
          value={newQuiz.description}
          onChange={e => onChange({ ...newQuiz, description: e.target.value })}
          placeholder="Enter quiz description"
          rows="3"
          disabled={isSubmitting} />
      </div>

      <div className={styles.flexRow}>
        <div className={`${styles.formGroup} ${styles.flexColumn}`}>
          <label className={styles.label}>Category</label>
          <input
            className={styles.input}
            type="text"
            value={newQuiz.category}
            onChange={e => onChange({ ...newQuiz, category: e.target.value })}
            placeholder="e.g., General, Bhagavad Gita, Computer Science, HR"
            disabled={isSubmitting} />
        </div>
        <div className={`${styles.formGroup} ${styles.flexColumn}`}>
          <label className={styles.label}>Difficulty</label>
          <select
            className={styles.select}
            value={newQuiz.difficulty}
            onChange={e => onChange({ ...newQuiz, difficulty: e.target.value })}
            disabled={isSubmitting}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className={styles.flexRow}>
        <div className={`${styles.formGroup} ${styles.flexColumn}`}>
          <label className={styles.checkboxLabel}>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={newQuiz.timerEnabled}
              onChange={e => onChange({ ...newQuiz, timerEnabled: e.target.checked })}
              disabled={isSubmitting} />
            Enable Timer
          </label>
        </div>
        {newQuiz.timerEnabled && (
          <div className={`${styles.formGroup} ${styles.flexColumn}`}>
            <label className={styles.label}>Time Limit (minutes)</label>
            <input
              className={styles.input}
              type="number"
              value={newQuiz.timeLimit}
              onChange={e => onChange({ ...newQuiz, timeLimit: parseInt(e.target.value) || 30 })}
              min="1" max="300"
              disabled={isSubmitting}
              placeholder="30" />
          </div>
        )}
      </div>

      {/* ── Quiz Visibility & Access Code ── */}
      <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <label className={styles.label} style={{ marginBottom: '10px', display: 'block', fontSize: '13px' }}>
          Quiz Access & Privacy Mode
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${!newQuiz.isPublic ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
            background: !newQuiz.isPublic ? 'var(--purple-12)' : 'transparent',
            cursor: 'pointer'
          }}>
            <input
              type="radio"
              name="quizAccessMode"
              checked={!newQuiz.isPublic}
              onChange={() => onChange({ ...newQuiz, isPublic: false })}
              disabled={isSubmitting}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                Private (Code-Only)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Hidden from public lists. Only people with your Quiz Code can see and play it.
              </div>
            </div>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${newQuiz.isPublic ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
            background: newQuiz.isPublic ? 'var(--purple-12)' : 'transparent',
            cursor: 'pointer'
          }}>
            <input
              type="radio"
              name="quizAccessMode"
              checked={newQuiz.isPublic}
              onChange={() => onChange({ ...newQuiz, isPublic: true })}
              disabled={isSubmitting}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                Public & Open
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Visible on public quizzes page. Anyone can browse and take it.
              </div>
            </div>
          </label>
        </div>

        <div className={styles.flexRow}>
          <div className={`${styles.formGroup} ${styles.flexColumn}`}>
            <label className={styles.label}>
              Quiz Code {!newQuiz.isPublic && <span style={{ color: 'var(--primary-400)' }}>(Share with players)</span>}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className={styles.input}
                type="text"
                value={newQuiz.quizCode || ''}
                onChange={e => onChange({ ...newQuiz, quizCode: e.target.value.toUpperCase() })}
                placeholder="e.g. IYF-GITA or click Auto"
                disabled={isSubmitting}
                style={{ fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 700 }}
              />
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ whiteSpace: 'nowrap', padding: '0 14px', fontSize: '12px' }}
                onClick={() => onChange({ ...newQuiz, quizCode: Math.random().toString(36).substring(2, 8).toUpperCase() })}>
                Generate Code
              </button>
            </div>
            <span className={styles.inputHint}>
              Players enter this code on the home screen or play page to launch this quiz.
            </span>
          </div>

          {newQuiz.isPublic && (
            <div className={`${styles.formGroup} ${styles.flexColumn}`}>
              <label className={styles.label}>Passcode (Optional)</label>
              <input
                className={styles.input}
                type="text"
                value={newQuiz.passcode || ''}
                onChange={e => onChange({ ...newQuiz, passcode: e.target.value })}
                placeholder="Leave blank for open access"
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

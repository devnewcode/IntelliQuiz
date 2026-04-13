'use client'
import styles from '../../admin/page.module.css'

// Quiz metadata form - title, description, category, difficulty, timer.
// Here i add these props:
//   newQuiz      — current quiz state object
//   onChange     — (updatedQuiz) => void
//   isSubmitting — boolean

export default function CreateQuizForm({ newQuiz, onChange, isSubmitting }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Create New Quiz</h2>

      {/* Title */}
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

      {/* Description */}
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

      {/* Category + Difficulty */}
      <div className={styles.flexRow}>
        <div className={`${styles.formGroup} ${styles.flexColumn}`}>
          <label className={styles.label}>Category</label>
          <input
            className={styles.input}
            type="text"
            value={newQuiz.category}
            onChange={e => onChange({ ...newQuiz, category: e.target.value })}
            placeholder="e.g., Math, Science, History"
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

      {/* Timer */}
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
    </div>
  )
}
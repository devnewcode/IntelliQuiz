'use client'
import { useState } from 'react'
import styles from '../../student/page.module.css'

// Available quizzes page for students with live search, difficulty filters,
// and responsive quiz cards.
// Props:
//   quizzes      — array of quiz objects from API
//   onStartQuiz  — (quiz) => void
//   user         — current user object (for nav display)
//   onGoHome     — () => void
//   onGoResults  — () => void

export default function QuizList({ quizzes = [], onStartQuiz, user, onGoHome, onGoResults }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  const getDifficultyTag = (d) => {
    if (d === 'easy') return styles.metaTagGreen
    if (d === 'hard') return styles.metaTagRed
    return styles.metaTagAmber
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch =
      quiz.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty =
      filterDifficulty === 'all' || quiz.difficulty === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  return (
    <div className={styles.container}>

      {/* Nav */}
      <div className={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🎓</span>
          <div>
            <h1 className={styles.navTitle} style={{ fontSize: '18px', margin: 0 }}>IntelliQuiz</h1>
            <span style={{ fontSize: '11.5px', color: 'var(--primary-300)', fontWeight: 600 }}>Available Quizzes</span>
          </div>
        </div>
        <div className={styles.navRight}>
          <span className={styles.navUser}>{user.name}</span>
          <button className={styles.navBtn} onClick={onGoHome}>Home</button>
          <button className={styles.navBtn} onClick={onGoResults}>My Results</button>
        </div>
      </div>

      {/* Search & Filter Bar (shown when quizzes exist) */}
      {quizzes.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by quiz name or category..."
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

          <div className={styles.filterPills}>
            <button
              type="button"
              className={`${styles.filterPill} ${filterDifficulty === 'all' ? styles.filterPillActive : ''}`}
              onClick={() => setFilterDifficulty('all')}>
              All ({quizzes.length})
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${filterDifficulty === 'easy' ? styles.filterPillActive : ''}`}
              onClick={() => setFilterDifficulty('easy')}>
              Easy
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${filterDifficulty === 'medium' ? styles.filterPillActive : ''}`}
              onClick={() => setFilterDifficulty('medium')}>
              Medium
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${filterDifficulty === 'hard' ? styles.filterPillActive : ''}`}
              onClick={() => setFilterDifficulty('hard')}>
              Hard
            </button>
          </div>
        </div>
      )}

      {/* Empty States */}
      {quizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>No quizzes available yet</div>
          <div className={styles.emptyText}>
            Check back later — your admin will publish quizzes soon!
          </div>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <div className={styles.emptyTitle}>No matching quizzes found</div>
          <div className={styles.emptyText}>
            Try clearing your search query or changing the difficulty filter.
          </div>
          <button
            type="button"
            className={styles.btnPrimary}
            style={{ marginTop: '16px' }}
            onClick={() => { setSearchQuery(''); setFilterDifficulty('all') }}>
            Clear Filters
          </button>
        </div>
      ) : (
        /* Quiz Grid */
        <div className={styles.quizGrid}>
          {filteredQuizzes.map(quiz => (
            <div key={quiz._id} className={styles.quizCard}>
              <div className={styles.quizCardHeader}>
                <h3 className={styles.quizCardTitle}>{quiz.title}</h3>
                <span className={`${styles.metaTag} ${getDifficultyTag(quiz.difficulty)}`}>
                  {quiz.difficulty ? quiz.difficulty.toUpperCase() : 'MEDIUM'}
                </span>
              </div>

              {quiz.description && (
                <p className={styles.quizCardDesc}>{quiz.description}</p>
              )}

              <div className={styles.quizMeta}>
                <span className={styles.metaTag}>
                  📁 {quiz.category || 'General'}
                </span>
                <span className={styles.metaTag}>
                  📝 {quiz.questions?.length || 0} questions
                </span>
                <span className={styles.metaTag}>
                  {quiz.timerEnabled ? `⏰ ${quiz.timeLimit} min` : '∞ No timer'}
                </span>
              </div>

              <div className={styles.quizCardFooter}>
                <button
                  className={styles.startBtn}
                  onClick={() => onStartQuiz(quiz)}>
                  Start Quiz →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../../results/page.module.css'

// Student personal analytics & results component with search,
// difficulty filtering, and score/date sorting.
// Props:
//   results       — array of student's own results
//   getScoreColor — (score) => styles className
//   getScoreEmoji — (score) => emoji string

export default function StudentResults({ results = [], getScoreColor, getScoreEmoji }) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'highest' | 'lowest'

  // Stats
  const myStats = {
    total: results.length,
    avgScore: results.length > 0
      ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
      : 0,
    excellent: results.filter(r => r.score >= 80).length,
    good: results.filter(r => r.score >= 60 && r.score < 80).length,
    needsWork: results.filter(r => r.score < 60).length
  }

  // Filter & Search
  let processedResults = results.filter(result => {
    const title = result.quiz?.title || ''
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesFilter = true
    if (filter === 'excellent') matchesFilter = result.score >= 80
    if (filter === 'good') matchesFilter = result.score >= 60 && result.score < 80
    if (filter === 'needsWork') matchesFilter = result.score < 60

    return matchesSearch && matchesFilter
  })

  // Sort
  processedResults = [...processedResults].sort((a, b) => {
    if (sortBy === 'highest') return b.score - a.score
    if (sortBy === 'lowest') return a.score - b.score
    return new Date(b.completedAt) - new Date(a.completedAt)
  })

  return (
    <>
      {results.length > 0 && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📝</div>
              <div className={styles.statValue}>{myStats.total}</div>
              <div className={styles.statLabel}>Total Attempts</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statValue}>{myStats.avgScore}%</div>
              <div className={styles.statLabel}>Average Score</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏆</div>
              <div className={styles.statValue}>{myStats.excellent}</div>
              <div className={styles.statLabel}>Mastery (80%+)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⭐</div>
              <div className={styles.statValue}>{myStats.good}</div>
              <div className={styles.statLabel}>Passing (60-79%)</div>
            </div>
          </div>

          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search your quiz results..."
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

            <div className={styles.sortGroup}>
              <span className={styles.filterLabel}>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={styles.sortSelect}>
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Score</option>
                <option value="lowest">Lowest Score</option>
              </select>
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
                onClick={() => setFilter('all')}>
                All ({results.length})
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'excellent' ? styles.filterActive : ''}`}
                onClick={() => setFilter('excellent')}>
                🏆 Excellent ({myStats.excellent})
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'good' ? styles.filterActive : ''}`}
                onClick={() => setFilter('good')}>
                ⭐ Good ({myStats.good})
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'needsWork' ? styles.filterActive : ''}`}
                onClick={() => setFilter('needsWork')}>
                📚 Needs Work ({myStats.needsWork})
              </button>
            </div>
          </div>
        </>
      )}

      {results.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>No quiz results found</h3>
          <p>Start taking quizzes to see your personal progress and analytics here!</p>
          <button
            onClick={() => router.push('/student')}
            className={styles.primaryBtn}
            style={{ marginTop: '16px' }}>
            Take Your First Quiz →
          </button>
        </div>
      ) : processedResults.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>No matching results</h3>
          <p>Try clearing your search query or switching your filter.</p>
          <button
            type="button"
            className={styles.filterBtn}
            style={{ marginTop: '16px' }}
            onClick={() => { setSearchQuery(''); setFilter('all') }}>
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className={styles.resultsGrid}>
          {processedResults.map((result) => (
            <div key={result._id} className={styles.quizCard}>
              <div className={styles.quizHeader}>
                <h3 className={styles.quizTitle}>
                  {result.quiz?.title || 'Quiz Attempt'}
                </h3>
                <div className={`${styles.scoreBadge} ${getScoreColor(result.score)}`}>
                  <span className={styles.scoreEmoji}>{getScoreEmoji(result.score)}</span>
                  <span className={styles.scoreValue}>{result.score}%</span>
                </div>
              </div>
              <div className={styles.resultDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>✅</span>
                  <span className={styles.detailText}>
                    <strong>{result.correctAnswers}</strong> of{' '}
                    <strong>{result.totalQuestions}</strong> correct
                  </span>
                </div>
                {result.timeTaken > 0 && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailIcon}>⏱️</span>
                    <span className={styles.detailText}>
                      {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                    </span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>📅</span>
                  <span className={styles.detailText}>
                    {new Date(result.completedAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })} at{' '}
                    {new Date(result.completedAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${getScoreColor(result.score)}`}
                  style={{ width: `${result.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
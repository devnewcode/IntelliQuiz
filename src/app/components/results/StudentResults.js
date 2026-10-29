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
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className={styles.statValue}>{myStats.total}</div>
              <div className={styles.statLabel}>Total Attempts</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div className={styles.statValue}>{myStats.avgScore}%</div>
              <div className={styles.statLabel}>Average Score</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div className={styles.statValue}>{myStats.excellent}</div>
              <div className={styles.statLabel}>Mastery (80%+)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className={styles.statValue}>{myStats.good}</div>
              <div className={styles.statLabel}>Passing (60-79%)</div>
            </div>
          </div>

          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
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
                className={styles.sortSelect}
                style={{ colorScheme: 'dark' }}>
                <option value="newest" style={{ backgroundColor: '#111827', color: '#f8fafc' }}>Most Recent</option>
                <option value="highest" style={{ backgroundColor: '#111827', color: '#f8fafc' }}>Highest Score</option>
                <option value="lowest" style={{ backgroundColor: '#111827', color: '#f8fafc' }}>Lowest Score</option>
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
                Mastery ({myStats.excellent})
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'good' ? styles.filterActive : ''}`}
                onClick={() => setFilter('good')}>
                Passing ({myStats.good})
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'needsWork' ? styles.filterActive : ''}`}
                onClick={() => setFilter('needsWork')}>
                Needs Review ({myStats.needsWork})
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
                  {result.quiz?.quizCode && (
                    <span className={styles.quizCodePillSmall} style={{ marginLeft: 8 }}>
                      Code: {result.quiz.quizCode}
                    </span>
                  )}
                </h3>
                <div className={`${styles.scoreBadge} ${getScoreColor(result.score)}`}>
                  <span className={styles.scoreEmoji}>{getScoreEmoji(result.score)}</span>
                  <span className={styles.scoreValue}>{result.score}%</span>
                </div>
              </div>
              <div className={styles.resultDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <span className={styles.detailText}>
                    <strong>{result.correctAnswers}</strong> of{' '}
                    <strong>{result.totalQuestions}</strong> correct
                  </span>
                </div>
                {result.timeTaken > 0 && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </span>
                    <span className={styles.detailText}>
                      {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                    </span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </span>
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
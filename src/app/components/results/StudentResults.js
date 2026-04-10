'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../../results/page.module.css'

// it shows the student's own flat list of results - stats, filter, result cards.
// here the props are:
//   results       — array of student's own results
//   getScoreColor — (score) => styles className
//   getScoreEmoji — (score) => emoji string

export default function StudentResults({ results, getScoreColor, getScoreEmoji }) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')

  // Stats
  const myStats = {
    total: results.length,
    avgScore: results.length > 0
      ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
      : 0,
    excellent: results.filter(r => r.score >= 80).length,
    good: results.filter(r => r.score >= 60 && r.score < 80).length
  }

  // Filter
  const filteredResults = results.filter(result => {
    if (filter === 'all') return true
    if (filter === 'excellent') return result.score >= 80
    if (filter === 'good') return result.score >= 60 && result.score < 80
    if (filter === 'needsWork') return result.score < 60
    return true
  })

  return (
    <>
      {/* Stats grid */}
      {results.length > 0 && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📝</div>
              <div className={styles.statValue}>{myStats.total}</div>
              <div className={styles.statLabel}>Total Quizzes</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statValue}>{myStats.avgScore}%</div>
              <div className={styles.statLabel}>Average Score</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏆</div>
              <div className={styles.statValue}>{myStats.excellent}</div>
              <div className={styles.statLabel}>Excellent (80%+)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⭐</div>
              <div className={styles.statValue}>{myStats.good}</div>
              <div className={styles.statLabel}>Good (60-79%)</div>
            </div>
          </div>

          {/* Filter bar */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Filter Results:</div>
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
                📚 Needs Work ({results.filter(r => r.score < 60).length})
              </button>
            </div>
          </div>
        </>
      )}

      {/* Results list */}
      {filteredResults.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>No quiz results found</h3>
          <p>
            {filter !== 'all'
              ? 'Try changing the filter'
              : 'Start taking quizzes to see your results here!'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => router.push('/student')}
              className={styles.primaryBtn}>
              Take Your First Quiz
            </button>
          )}
        </div>
      ) : (
        <div className={styles.resultsGrid}>
          {filteredResults.map((result) => (
            <div key={result._id} className={styles.quizCard}>
              <div className={styles.quizHeader}>
                <h3 className={styles.quizTitle}>
                  {result.quiz?.title || 'Quiz Title Not Available'}
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
                    {new Date(result.completedAt).toLocaleDateString()} at{' '}
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
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'

export default function Results() {
  const { user, loading } = useAuth()
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
    }
    fetchResults()
  }, [user, loading, router])

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok) {
        setResults(data.results)
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return styles.scoreExcellent
    if (score >= 60) return styles.scoreGood
    if (score >= 40) return styles.scoreFair
    return styles.scorePoor
  }

  const getScoreEmoji = (score) => {
    if (score >= 80) return '🏆'
    if (score >= 60) return '⭐'
    if (score >= 40) return '👍'
    return '📚'
  }

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true
    if (filter === 'excellent') return result.score >= 80
    if (filter === 'good') return result.score >= 60 && result.score < 80
    if (filter === 'needsWork') return result.score < 60
    return true
  })

  const stats = {
    total: results.length,
    avgScore: results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length) : 0,
    excellent: results.filter(r => r.score >= 80).length,
    good: results.filter(r => r.score >= 60 && r.score < 80).length
  }

  if (loading || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading results...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Access denied. Please login.</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <h1>
          <span className={styles.pageIcon}>📊</span>
          {user.role === 'admin' ? 'All Quiz Results' : 'My Quiz Results'}
        </h1>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name}</span>
          <button onClick={() => router.push('/')} className={styles.navBtn}>Home</button>
          {user.role === 'student' && (
            <button onClick={() => router.push('/student')} className={styles.navBtnPrimary}>Take Quiz</button>
          )}
          {user.role === 'admin' && (
            <button onClick={() => router.push('/admin')} className={styles.navBtnPrimary}>Admin Panel</button>
          )}
        </div>
      </div>

      <div className={styles.resultsWrapper}>
        {results.length > 0 && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📝</div>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>Total Quizzes</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📈</div>
                <div className={styles.statValue}>{stats.avgScore}%</div>
                <div className={styles.statLabel}>Average Score</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🏆</div>
                <div className={styles.statValue}>{stats.excellent}</div>
                <div className={styles.statLabel}>Excellent (80%+)</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⭐</div>
                <div className={styles.statValue}>{stats.good}</div>
                <div className={styles.statLabel}>Good (60-79%)</div>
              </div>
            </div>

            <div className={styles.filterSection}>
              <div className={styles.filterLabel}>Filter Results:</div>
              <div className={styles.filterButtons}>
                <button 
                  className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({results.length})
                </button>
                <button 
                  className={`${styles.filterBtn} ${filter === 'excellent' ? styles.filterActive : ''}`}
                  onClick={() => setFilter('excellent')}
                >
                  🏆 Excellent ({stats.excellent})
                </button>
                <button 
                  className={`${styles.filterBtn} ${filter === 'good' ? styles.filterActive : ''}`}
                  onClick={() => setFilter('good')}
                >
                  ⭐ Good ({stats.good})
                </button>
                <button 
                  className={`${styles.filterBtn} ${filter === 'needsWork' ? styles.filterActive : ''}`}
                  onClick={() => setFilter('needsWork')}
                >
                  📚 Needs Work ({results.filter(r => r.score < 60).length})
                </button>
              </div>
            </div>
          </>
        )}

        {filteredResults.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No quiz results found</h3>
            <p>{filter !== 'all' ? 'Try changing the filter' : 'Start taking quizzes to see your results here!'}</p>
            {user.role === 'student' && filter === 'all' && (
              <button onClick={() => router.push('/student')} className={styles.primaryBtn}>
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
                
                {user.role === 'admin' && result.user && (
                  <div className={styles.studentInfo}>
                    <span className={styles.infoIcon}>👤</span>
                    <span><strong>{result.user.name}</strong> ({result.user.email})</span>
                  </div>
                )}
                
                <div className={styles.resultDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailIcon}>✅</span>
                    <span className={styles.detailText}>
                      <strong>{result.correctAnswers}</strong> of <strong>{result.totalQuestions}</strong> correct
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
                      {new Date(result.completedAt).toLocaleDateString()} at {new Date(result.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
                
                <div className={styles.progressBar}>
                  <div 
                    className={`${styles.progressFill} ${getScoreColor(result.score)}`}
                    style={{ width: `${result.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
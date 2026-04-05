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
  const [expandedStudent, setExpandedStudent] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/'); return }
    }
    fetchResults()
  }, [user, loading, router])

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/results', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) setResults(data.results || [])
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

  // ── CSV EXPORT ──
  // Converts all results into a downloadable CSV file.
  // Each row = one quiz attempt. File is named with today's date.
  const exportToCSV = () => {
    const headers = [
      'Student Name',
      'Email',
      'Quiz Title',
      'Score (%)',
      'Correct',
      'Total Questions',
      'Time Taken',
      'Date'
    ]

    const rows = results.map(r => [
      r.user?.name || 'Unknown',
      r.user?.email || 'Unknown',
      r.quiz?.title || 'Unknown Quiz',
      r.score,
      r.correctAnswers,
      r.totalQuestions,
      r.timeTaken > 0
        ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s`
        : '—',
      new Date(r.completedAt).toLocaleDateString() +
        ' ' +
        new Date(r.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `intelliquiz-results-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  // ── END CSV EXPORT ──

  // ── Group results by student (admin only) ──────────
  const groupedByStudent = (results || []).reduce((acc, result) => {
    if (!result.user) return acc
    const uid = result.user._id || result.user.email
    if (!acc[uid]) {
      acc[uid] = {
        user: result.user,
        attempts: []
      }
    }
    acc[uid].attempts.push(result)
    return acc
  }, {})

  const studentList = Object.values(groupedByStudent).map(({ user: u, attempts }) => {
    const avgScore = Math.round(attempts.reduce((a, r) => a + r.score, 0) / attempts.length)
    const best = Math.max(...attempts.map(r => r.score))
    const latest = attempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
    return { user: u, attempts, avgScore, best, latest }
  })

  // ── Student-level filter ───────────────────────────
  const filteredStudents = studentList.filter(s => {
    if (filter === 'all') return true
    if (filter === 'excellent') return s.avgScore >= 80
    if (filter === 'good') return s.avgScore >= 60 && s.avgScore < 80
    if (filter === 'needsWork') return s.avgScore < 60
    return true
  })

  // ── Stats (admin) ──────────────────────────────────
  const adminStats = {
    totalStudents: studentList.length,
    totalAttempts: results.length,
    avgScore: studentList.length > 0
      ? Math.round(studentList.reduce((a, s) => a + s.avgScore, 0) / studentList.length)
      : 0,
    topStudent: [...studentList].sort((a, b) => b.avgScore - a.avgScore)[0]?.user?.name || '—'
  }

  // ── Student own stats ──────────────────────────────
  const myStats = {
    total: results.length,
    avgScore: results.length > 0
      ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0,
    excellent: results.filter(r => r.score >= 80).length,
    good: results.filter(r => r.score >= 60 && r.score < 80).length
  }

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true
    if (filter === 'excellent') return result.score >= 80
    if (filter === 'good') return result.score >= 60 && result.score < 80
    if (filter === 'needsWork') return result.score < 60
    return true
  })

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

      {/* ── Nav ── */}
      <div className={styles.nav}>
        <h1>
          <span className={styles.pageIcon}>📊</span>
          {(user.role === 'admin' || user.role === 'superadmin') ? 'All Quiz Results' : 'My Quiz Results'}
        </h1>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name}</span>
          <button onClick={() => router.push('/')} className={styles.navBtn}>Home</button>
          {user.role === 'student' && (
            <button onClick={() => router.push('/student')} className={styles.navBtnPrimary}>Take Quiz</button>
          )}
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <button onClick={() => router.push('/admin')} className={styles.navBtnPrimary}>Admin Panel</button>
          )}
          {/* ── CSV EXPORT BUTTON — admin only, hidden when no results ── */}
          {(user.role === 'admin' || user.role === 'superadmin') && results.length > 0 && (
            <button onClick={exportToCSV} className={styles.navBtn}>
              ⬇ Export CSV
            </button>
          )}
          {/* ── END CSV EXPORT BUTTON ── */}
        </div>
      </div>

      <div className={styles.resultsWrapper}>

        {/* ════════════════════════════════════════════
            ADMIN VIEW — grouped by student
        ════════════════════════════════════════════ */}
        {(user.role === 'admin' || user.role === 'superadmin') && (
          <>
            {/* Admin stats */}
            {studentList.length > 0 && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statValue}>{adminStats.totalStudents}</div>
                  <div className={styles.statLabel}>Total Students</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📝</div>
                  <div className={styles.statValue}>{adminStats.totalAttempts}</div>
                  <div className={styles.statLabel}>Total Attempts</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📈</div>
                  <div className={styles.statValue}>{adminStats.avgScore}%</div>
                  <div className={styles.statLabel}>Class Average</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>🏆</div>
                  <div className={styles.statValue} style={{ fontSize: '16px' }}>{adminStats.topStudent}</div>
                  <div className={styles.statLabel}>Top Student</div>
                </div>
              </div>
            )}

            {/* Filter */}
            {studentList.length > 0 && (
              <div className={styles.filterSection}>
                <div className={styles.filterLabel}>Filter by Avg Score:</div>
                <div className={styles.filterButtons}>
                  {[
                    { key: 'all', label: `All (${studentList.length})` },
                    { key: 'excellent', label: `🏆 Excellent` },
                    { key: 'good', label: `⭐ Good` },
                    { key: 'needsWork', label: `📚 Needs Work` },
                  ].map(f => (
                    <button key={f.key}
                      className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
                      onClick={() => setFilter(f.key)}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Student cards */}
            {filteredStudents.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <h3>No results found</h3>
                <p>{filter !== 'all' ? 'Try changing the filter' : 'No quiz attempts yet.'}</p>
              </div>
            ) : (
              <div className={styles.studentList}>
                {filteredStudents.map(({ user: u, attempts, avgScore, best, latest }) => {
                  const isOpen = expandedStudent === (u._id || u.email)
                  return (
                    <div key={u._id || u.email} className={`${styles.studentCard} ${isOpen ? styles.studentCardOpen : ''}`}>

                      {/* Student summary row — clickable */}
                      <div className={styles.studentRow}
                        onClick={() => setExpandedStudent(isOpen ? null : (u._id || u.email))}>
                        <div className={styles.studentAvatar}>
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className={styles.studentMeta}>
                          <div className={styles.studentName}>{u.name}</div>
                          <div className={styles.studentEmail}>{u.email}</div>
                        </div>
                        <div className={styles.studentSummaryStats}>
                          <div className={styles.summStat}>
                            <span className={styles.summStatVal}>{attempts.length}</span>
                            <span className={styles.summStatLbl}>Attempts</span>
                          </div>
                          <div className={styles.summStat}>
                            <span className={styles.summStatVal}>{best}%</span>
                            <span className={styles.summStatLbl}>Best</span>
                          </div>
                          <div className={styles.summStat}>
                            <span className={`${styles.summStatVal} ${getScoreColor(avgScore)}`}>{avgScore}%</span>
                            <span className={styles.summStatLbl}>Avg</span>
                          </div>
                        </div>
                        <div className={`${styles.avgBadge} ${getScoreColor(avgScore)}`}>
                          {getScoreEmoji(avgScore)} {avgScore}%
                        </div>
                        <div className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</div>
                      </div>

                      {/* Expanded attempts */}
                      {isOpen && (
                        <div className={styles.attemptsPanel}>
                          <div className={styles.attemptsPanelTitle}>
                            All Attempts by {u.name}
                          </div>
                          <div className={styles.attemptsGrid}>
                            {attempts
                              .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                              .map((result, i) => (
                                <div key={result._id} className={styles.attemptCard}>
                                  <div className={styles.attemptHeader}>
                                    <span className={styles.attemptNum}>#{attempts.length - i}</span>
                                    <div className={`${styles.scoreBadge} ${getScoreColor(result.score)}`}>
                                      <span className={styles.scoreEmoji}>{getScoreEmoji(result.score)}</span>
                                      <span className={styles.scoreValue}>{result.score}%</span>
                                    </div>
                                  </div>
                                  <div className={styles.attemptQuizName}>
                                    {result.quiz?.title || 'Quiz'}
                                  </div>
                                  <div className={styles.resultDetails}>
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailIcon}>✅</span>
                                      <span className={styles.detailText}>
                                        <strong>{result.correctAnswers}</strong> / <strong>{result.totalQuestions}</strong> correct
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
                                        {new Date(result.completedAt).toLocaleDateString()} at {new Date(result.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className={styles.progressBar}>
                                    <div className={`${styles.progressFill} ${getScoreColor(result.score)}`}
                                      style={{ width: `${result.score}%` }} />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════
            STUDENT VIEW — unchanged flat list
        ════════════════════════════════════════════ */}
        {user.role === 'student' && (
          <>
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

                <div className={styles.filterSection}>
                  <div className={styles.filterLabel}>Filter Results:</div>
                  <div className={styles.filterButtons}>
                    <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')}>All ({results.length})</button>
                    <button className={`${styles.filterBtn} ${filter === 'excellent' ? styles.filterActive : ''}`} onClick={() => setFilter('excellent')}>🏆 Excellent ({myStats.excellent})</button>
                    <button className={`${styles.filterBtn} ${filter === 'good' ? styles.filterActive : ''}`} onClick={() => setFilter('good')}>⭐ Good ({myStats.good})</button>
                    <button className={`${styles.filterBtn} ${filter === 'needsWork' ? styles.filterActive : ''}`} onClick={() => setFilter('needsWork')}>📚 Needs Work ({results.filter(r => r.score < 60).length})</button>
                  </div>
                </div>
              </>
            )}

            {filteredResults.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <h3>No quiz results found</h3>
                <p>{filter !== 'all' ? 'Try changing the filter' : 'Start taking quizzes to see your results here!'}</p>
                {filter === 'all' && (
                  <button onClick={() => router.push('/student')} className={styles.primaryBtn}>Take Your First Quiz</button>
                )}
              </div>
            ) : (
              <div className={styles.resultsGrid}>
                {filteredResults.map((result) => (
                  <div key={result._id} className={styles.quizCard}>
                    <div className={styles.quizHeader}>
                      <h3 className={styles.quizTitle}>{result.quiz?.title || 'Quiz Title Not Available'}</h3>
                      <div className={`${styles.scoreBadge} ${getScoreColor(result.score)}`}>
                        <span className={styles.scoreEmoji}>{getScoreEmoji(result.score)}</span>
                        <span className={styles.scoreValue}>{result.score}%</span>
                      </div>
                    </div>
                    <div className={styles.resultDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>✅</span>
                        <span className={styles.detailText}><strong>{result.correctAnswers}</strong> of <strong>{result.totalQuestions}</strong> correct</span>
                      </div>
                      {result.timeTaken > 0 && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>⏱️</span>
                          <span className={styles.detailText}>{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                        </div>
                      )}
                      <div className={styles.detailItem}>
                        <span className={styles.detailIcon}>📅</span>
                        <span className={styles.detailText}>{new Date(result.completedAt).toLocaleDateString()} at {new Date(result.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={`${styles.progressFill} ${getScoreColor(result.score)}`} style={{ width: `${result.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
'use client'
import { useState } from 'react'
import styles from '../../results/page.module.css'

// this will show admin or superadmin grouped view - stats, filter, expandable student cards.
// also handles guest results (no user account) from public quiz play.
// Props:
//   results       — full results array
//   getScoreColor — (score) => styles className
//   getScoreEmoji — (score) => emoji string

export default function AdminResults({ results, getScoreColor, getScoreEmoji }) {
  const [filter, setFilter] = useState('all')
  const [expandedStudent, setExpandedStudent] = useState(null)

  // ── Group results by student OR guest ──
  // For logged-in students: group by user._id
  // For guests: group by guestEmail
  const groupedByStudent = (results || []).reduce((acc, result) => {
    const uid = result.user?._id || result.user?.email || result.guestEmail
    if (!uid) return acc

    if (!acc[uid]) {
      acc[uid] = {
        // if no user account, build a fake user object from guest fields
        user: result.user || {
          name: result.guestName || 'Guest',
          email: result.guestEmail || ''
        },
        attempts: [],
        isGuest: !result.user  // true if this is a guest participant
      }
    }
    acc[uid].attempts.push(result)
    return acc
  }, {})

  const studentList = Object.values(groupedByStudent).map(({ user: u, attempts, isGuest }) => {
    const avgScore = Math.round(attempts.reduce((a, r) => a + r.score, 0) / attempts.length)
    const best = Math.max(...attempts.map(r => r.score))
    const latest = [...attempts].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
    return { user: u, attempts, avgScore, best, latest, isGuest }
  })

  // Stats
  const adminStats = {
    totalStudents: studentList.length,
    totalAttempts: results.length,
    avgScore: studentList.length > 0
      ? Math.round(studentList.reduce((a, s) => a + s.avgScore, 0) / studentList.length)
      : 0,
    topStudent: [...studentList].sort((a, b) => b.avgScore - a.avgScore)[0]?.user?.name || '—'
  }

  // Filter
  const filteredStudents = studentList.filter(s => {
    if (filter === 'all') return true
    if (filter === 'excellent') return s.avgScore >= 80
    if (filter === 'good') return s.avgScore >= 60 && s.avgScore < 80
    if (filter === 'needsWork') return s.avgScore < 60
    return true
  })

  return (
    <>
      {/* Stats grid */}
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
            <div className={styles.statValue} style={{ fontSize: '16px' }}>
              {adminStats.topStudent}
            </div>
            <div className={styles.statLabel}>Top Student</div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {studentList.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.filterLabel}>Filter by Avg Score:</div>
          <div className={styles.filterButtons}>
            {[
              { key: 'all',       label: `All (${studentList.length})` },
              { key: 'excellent', label: '🏆 Excellent' },
              { key: 'good',      label: '⭐ Good' },
              { key: 'needsWork', label: '📚 Needs Work' },
            ].map(f => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
                onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Student / Guest cards */}
      {filteredStudents.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>No results found</h3>
          <p>{filter !== 'all' ? 'Try changing the filter' : 'No quiz attempts yet.'}</p>
        </div>
      ) : (
        <div className={styles.studentList}>
          {filteredStudents.map(({ user: u, attempts, avgScore, best, isGuest }) => {
            const isOpen = expandedStudent === (u._id || u.email)
            return (
              <div
                key={u._id || u.email}
                className={`${styles.studentCard} ${isOpen ? styles.studentCardOpen : ''}`}>

                {/* Summary row — clickable to expand */}
                <div
                  className={styles.studentRow}
                  onClick={() => setExpandedStudent(isOpen ? null : (u._id || u.email))}>

                  {/* Avatar — orange for guests, purple for students */}
                  <div
                    className={styles.studentAvatar}
                    style={isGuest ? { background: 'linear-gradient(135deg,#d97706,#f59e0b)' } : {}}>
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div className={styles.studentMeta}>
                    <div className={styles.studentName}>
                      {u.name}
                      {/* Guest badge */}
                      {isGuest && (
                        <span style={{
                          marginLeft: 8, fontSize: 11,
                          background: 'rgba(245,158,11,.2)', color: '#fcd34d',
                          padding: '2px 8px', borderRadius: 20, fontWeight: 700
                        }}>
                          Guest
                        </span>
                      )}
                    </div>
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
                      <span className={`${styles.summStatVal} ${getScoreColor(avgScore)}`}>
                        {avgScore}%
                      </span>
                      <span className={styles.summStatLbl}>Avg</span>
                    </div>
                  </div>

                  <div className={`${styles.avgBadge} ${getScoreColor(avgScore)}`}>
                    {getScoreEmoji(avgScore)} {avgScore}%
                  </div>
                  <div className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</div>
                </div>

                {/* Expanded attempts panel */}
                {isOpen && (
                  <div className={styles.attemptsPanel}>
                    <div className={styles.attemptsPanelTitle}>
                      All Attempts by {u.name}
                    </div>
                    <div className={styles.attemptsGrid}>
                      {[...attempts]
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
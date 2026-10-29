'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './StudentDashboard.module.css'

export default function StudentDashboard({ user, logout }) {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [recentResults, setRecentResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/results', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      const results = data.results || []

      const avgScore = results.length > 0
        ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
        : 0
      const best = results.length > 0
        ? Math.max(...results.map(r => r.score))
        : 0
      const excellent = results.filter(r => r.score >= 80).length
      const needsWork = results.filter(r => r.score < 60).length

      setStats({
        total: results.length,
        avgScore,
        best,
        excellent,
        needsWork
      })
      setRecentResults(results.slice(0, 3))
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e)
    }
    setLoading(false)
  }

  const getMotivation = (avg) => {
    if (avg === 0) return { msg: 'Take your first quiz and start your journey!', emoji: '🚀' }
    if (avg >= 80) return { msg: 'Outstanding performance! You are on fire!', emoji: '🔥' }
    if (avg >= 60) return { msg: 'Great work! Keep pushing to reach the top!', emoji: '⭐' }
    if (avg >= 40) return { msg: 'Good effort! Practice more to improve!', emoji: '💪' }
    return { msg: "Don't give up! Every attempt makes you better!", emoji: '📚' }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return styles.scoreGreen
    if (score >= 60) return styles.scoreBlue
    if (score >= 40) return styles.scoreAmber
    return styles.scoreRed
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  const motivation = getMotivation(stats?.avgScore || 0)

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--grad-primary)',
              color: '#fff'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
              </svg>
            </div>
            <div>
              <h1 className={styles.logo} style={{ margin: 0, fontSize: '19px' }}>IntelliQuiz</h1>
              <span style={{ fontSize: '11.5px', color: 'var(--primary-300)', fontWeight: 600 }}>Student Dashboard</span>
            </div>
          </div>
          <div className={styles.navRight}>
            <span className={styles.navName}>{user.name}</span>
            <span className={styles.navRole}>Student</span>
            <button onClick={logout} className={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>

      <div className={styles.wrapper}>
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEmoji}>{motivation.emoji}</div>
            <div>
              <h2 className={styles.heroTitle}>Hey, {user.name}!</h2>
              <p className={styles.heroSubtitle}>{motivation.msg}</p>
            </div>
          </div>
          <div className={styles.heroRight}>
            <button onClick={() => router.push('/student')} className={styles.heroBtn}>
              Start Quiz →
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.statsGrid}>
            {[1,2,3,4].map(i => <div key={i} className={styles.statSkeleton} />)}
          </div>
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className={styles.statVal}>{stats.total}</div>
              <div className={styles.statLbl}>Quizzes Taken</div>
              <div className={styles.statSub}>Total attempts</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div className={`${styles.statVal} ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}%</div>
              <div className={styles.statLbl}>Average Score</div>
              <div className={styles.statSub}>Across all quizzes</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div className={`${styles.statVal} ${getScoreColor(stats.best)}`}>{stats.best}%</div>
              <div className={styles.statLbl}>Best Score</div>
              <div className={styles.statSub}>Personal best</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className={styles.statVal}>{stats.excellent}</div>
              <div className={styles.statLbl}>Excellent (80%+)</div>
              <div className={styles.statSub}>{stats.needsWork} need improvement</div>
            </div>
          </div>
        )}

        <div className={styles.bottomGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Recent Activity</h3>
              <button onClick={() => router.push('/results')} className={styles.panelLink}>
                View all →
              </button>
            </div>
            {loading ? (
              <div className={styles.skeletonList}>
                {[1,2,3].map(i => <div key={i} className={styles.resultSkeleton} />)}
              </div>
            ) : recentResults.length === 0 ? (
              <div className={styles.emptyRecent}>
                <div className={styles.emptyRecentIcon}>📋</div>
                <p>No quizzes taken yet</p>
                <button onClick={() => router.push('/student')} className={styles.emptyRecentBtn}>
                  Take your first quiz
                </button>
              </div>
            ) : (
              <div className={styles.resultList}>
                {recentResults.map((r, i) => (
                  <div key={r._id || i} className={styles.resultItem}>
                    <div className={styles.resultLeft}>
                      <div className={styles.resultQuiz}>{r.quiz?.title || 'Quiz'}</div>
                      <div className={styles.resultDate}>{formatDate(r.completedAt)}</div>
                    </div>
                    <div className={`${styles.resultScore} ${getScoreColor(r.score)}`}>
                      {r.score}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Quick Actions</h3>
            </div>
            <div className={styles.actionList}>
              <button onClick={() => router.push('/student')} className={styles.actionCard}>
                <span className={styles.actionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </span>
                <div>
                  <div className={styles.actionTitle}>Take a Quiz</div>
                  <div className={styles.actionDesc}>Browse public or enter quiz code</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </button>
              <button onClick={() => router.push('/multiplayer')} className={styles.actionCard}>
                <span className={styles.actionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </span>
                <div>
                  <div className={styles.actionTitle}>Live Multiplayer</div>
                  <div className={styles.actionDesc}>Join game with room code</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </button>
              <button onClick={() => router.push('/results')} className={styles.actionCard}>
                <span className={styles.actionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </span>
                <div>
                  <div className={styles.actionTitle}>My Results</div>
                  <div className={styles.actionDesc}>View all past attempts</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </button>
              <button onClick={() => router.push('/')} className={styles.actionCard}>
                <span className={styles.actionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span>
                <div>
                  <div className={styles.actionTitle}>Home</div>
                  <div className={styles.actionDesc}>Back to main page</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
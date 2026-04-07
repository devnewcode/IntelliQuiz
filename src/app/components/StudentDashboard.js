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

      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <h1 className={styles.logo}>🎓 IntelliQuiz</h1>
          <div className={styles.navRight}>
            <span className={styles.navName}>{user.name}</span>
            <span className={styles.navRole}>Student</span>
            <button onClick={logout} className={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>

      <div className={styles.wrapper}>

        {/* ── Hero banner ── */}
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

        {/* ── Stats grid ── */}
        {loading ? (
          <div className={styles.statsGrid}>
            {[1,2,3,4].map(i => <div key={i} className={styles.statSkeleton} />)}
          </div>
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📝</div>
              <div className={styles.statVal}>{stats.total}</div>
              <div className={styles.statLbl}>Quizzes Taken</div>
              <div className={styles.statSub}>Total attempts</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📈</div>
              <div className={`${styles.statVal} ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}%</div>
              <div className={styles.statLbl}>Average Score</div>
              <div className={styles.statSub}>Across all quizzes</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏆</div>
              <div className={`${styles.statVal} ${getScoreColor(stats.best)}`}>{stats.best}%</div>
              <div className={styles.statLbl}>Best Score</div>
              <div className={styles.statSub}>Personal best</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⭐</div>
              <div className={styles.statVal}>{stats.excellent}</div>
              <div className={styles.statLbl}>Excellent (80%+)</div>
              <div className={styles.statSub}>{stats.needsWork} need improvement</div>
            </div>
          </div>
        )}

        {/* ── Bottom section: recent + quick actions ── */}
        <div className={styles.bottomGrid}>

          {/* Recent activity */}
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

          {/* Quick actions */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Quick Actions</h3>
            </div>
            <div className={styles.actionList}>
              <button onClick={() => router.push('/student')} className={styles.actionCard}>
                <span className={styles.actionIcon}>📝</span>
                <div>
                  <div className={styles.actionTitle}>Take a Quiz</div>
                  <div className={styles.actionDesc}>Browse available quizzes</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </button>
              <button onClick={() => router.push('/results')} className={styles.actionCard}>
                <span className={styles.actionIcon}>📊</span>
                <div>
                  <div className={styles.actionTitle}>My Results</div>
                  <div className={styles.actionDesc}>View all past attempts</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </button>
              <button onClick={() => router.push('/')} className={styles.actionCard}>
                <span className={styles.actionIcon}>🏠</span>
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
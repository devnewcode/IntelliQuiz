'use client'
import { useState } from 'react'
import styles from '../../results/page.module.css'

export default function AdminResults({
  results = [],
  quizzes = [],
  getScoreColor,
  getScoreEmoji
}) {
  const [activeView, setActiveView] = useState('quiz') // 'quiz' | 'student'
  const [selectedQuizId, setSelectedQuizId] = useState(() => {
    return quizzes[0]?._id || 'all'
  })
  const [copiedCode, setCopiedCode] = useState(false)
  const [searchLeaderboard, setSearchLeaderboard] = useState('')

  // State for "By Participant" view
  const [studentFilter, setStudentFilter] = useState('all')
  const [expandedStudent, setExpandedStudent] = useState(null)

  // Current selected quiz
  const currentQuiz = quizzes.find(q => q._id === selectedQuizId)

  // Filter results for selected quiz
  const quizResults = results.filter(r => {
    if (selectedQuizId === 'all') return true
    const qid = r.quiz?._id || r.quiz
    return String(qid) === String(selectedQuizId)
  })

  // Ranked results: highest score first, then fastest time, then earliest completion
  const rankedResults = [...quizResults]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.timeTaken > 0 && b.timeTaken > 0) return a.timeTaken - b.timeTaken
      return new Date(a.completedAt) - new Date(b.completedAt)
    })
    .filter(r => {
      if (!searchLeaderboard.trim()) return true
      const q = searchLeaderboard.toLowerCase()
      const name = (r.user?.name || r.guestName || '').toLowerCase()
      const email = (r.user?.email || r.guestEmail || '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })

  // Quiz-specific statistics
  const totalSubmissions = quizResults.length
  const avgQuizScore = totalSubmissions > 0
    ? Math.round(quizResults.reduce((a, r) => a + r.score, 0) / totalSubmissions)
    : 0
  const highestQuizScore = totalSubmissions > 0
    ? Math.max(...quizResults.map(r => r.score))
    : 0
  const passRate = totalSubmissions > 0
    ? Math.round((quizResults.filter(r => r.score >= 60).length / totalSubmissions) * 100)
    : 0

  const handleCopyCode = (code) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const exportQuizLeaderboardCSV = () => {
    const quizTitle = currentQuiz?.title || (selectedQuizId === 'all' ? 'All Quizzes' : 'Quiz')
    const quizCode = currentQuiz?.quizCode || 'N/A'
    const headers = [
      'Rank', 'Participant Name', 'Email', 'Role / Type', 'Score (%)',
      'Correct Answers', 'Total Questions', 'Time Taken (s)', 'Time Formatted', 'Submitted Date', 'Quiz Code'
    ]

    const rows = rankedResults.map((r, idx) => {
      const name = r.user?.name || r.guestName || 'Guest Participant'
      const email = r.user?.email || r.guestEmail || 'N/A'
      const role = r.user ? (r.user.role || 'Student') : 'Guest'
      const timeStr = r.timeTaken > 0 ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : '-'
      const dateStr = new Date(r.completedAt).toLocaleString()

      return [
        idx + 1,
        name,
        email,
        role,
        r.score,
        r.correctAnswers,
        r.totalQuestions,
        r.timeTaken || 0,
        timeStr,
        dateStr,
        r.quiz?.quizCode || quizCode
      ]
    })

    const csvContent = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const safeTitle = quizTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')
    link.download = `leaderboard-${safeTitle}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── "By Participant" Grouping ──
  const groupedByStudent = results.reduce((acc, result) => {
    const uid = result.user?._id || result.user?.email || result.guestEmail
    if (!uid) return acc

    if (!acc[uid]) {
      acc[uid] = {
        user: result.user || {
          name: result.guestName || 'Guest',
          email: result.guestEmail || ''
        },
        attempts: [],
        isGuest: !result.user
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

  const adminStats = {
    totalStudents: studentList.length,
    totalAttempts: results.length,
    avgScore: studentList.length > 0
      ? Math.round(studentList.reduce((a, s) => a + s.avgScore, 0) / studentList.length)
      : 0,
    topStudent: [...studentList].sort((a, b) => b.avgScore - a.avgScore)[0]?.user?.name || '—'
  }

  const filteredStudents = studentList.filter(s => {
    if (studentFilter === 'all') return true
    if (studentFilter === 'excellent') return s.avgScore >= 80
    if (studentFilter === 'good') return s.avgScore >= 60 && s.avgScore < 80
    if (studentFilter === 'needsWork') return s.avgScore < 60
    return true
  })

  const renderRankBadge = (rank) => {
    if (rank === 1) return <span className={`${styles.rankBadge} ${styles.rankGold}`} title="1st Place">🥇</span>
    if (rank === 2) return <span className={`${styles.rankBadge} ${styles.rankSilver}`} title="2nd Place">🥈</span>
    if (rank === 3) return <span className={`${styles.rankBadge} ${styles.rankBronze}`} title="3rd Place">🥉</span>
    return <span className={styles.rankDefault}>#{rank}</span>
  }

  return (
    <>
      {/* ── View Switcher Tabs ── */}
      <div className={styles.viewSwitchTabs}>
        <button
          type="button"
          className={`${styles.viewSwitchBtn} ${activeView === 'quiz' ? styles.viewSwitchBtnActive : ''}`}
          onClick={() => setActiveView('quiz')}>
          Leaderboard by Quiz
        </button>
        <button
          type="button"
          className={`${styles.viewSwitchBtn} ${activeView === 'student' ? styles.viewSwitchBtnActive : ''}`}
          onClick={() => setActiveView('student')}>
          By Participant ({studentList.length})
        </button>
      </div>

      {activeView === 'quiz' && (
        <div>
          <div className={styles.quizSelectorBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>
                Select Quiz:
              </label>
              <select
                className={styles.quizSelect}
                value={selectedQuizId}
                onChange={e => setSelectedQuizId(e.target.value)}
                style={{ colorScheme: 'dark' }}>
                <option value="all" style={{ backgroundColor: '#111827', color: '#f8fafc' }}>All Quizzes (Overview)</option>
                {quizzes.map(q => (
                  <option key={q._id} value={q._id} style={{ backgroundColor: '#111827', color: '#f8fafc' }}>
                    {q.quizCode ? `[${q.quizCode}] ` : ''}{q.title} {q.isPublic === false ? '(Private)' : '(Public)'}
                  </option>
                ))}
              </select>

              {currentQuiz && (
                <div className={styles.quizPillsRow}>
                  {currentQuiz.isPublic === false ? (
                    <span className={`${styles.quizTypePill} ${styles.quizTypePrivate}`}>Private</span>
                  ) : (
                    <span className={`${styles.quizTypePill} ${styles.quizTypePublic}`}>Public</span>
                  )}
                  {currentQuiz.category && (
                    <span className={styles.quizTypePill} style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {currentQuiz.category}
                    </span>
                  )}
                </div>
              )}
            </div>

            {currentQuiz?.quizCode && (
              <div className={styles.quizCodePill}>
                <span>Code: {currentQuiz.quizCode}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(currentQuiz.quizCode)}
                  className={styles.copyCodeBtn}>
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div className={styles.statValue}>{totalSubmissions}</div>
              <div className={styles.statLabel}>Submissions</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div className={styles.statValue}>{avgQuizScore}%</div>
              <div className={styles.statLabel}>Average Score</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div className={styles.statValue}>{highestQuizScore}%</div>
              <div className={styles.statLabel}>Highest Score</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className={styles.statValue}>{passRate}%</div>
              <div className={styles.statLabel}>Pass Rate (≥60%)</div>
            </div>
          </div>

          <div className={styles.leaderboardCard}>
            <div className={styles.leaderboardHeaderBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className={styles.leaderboardTitle}>
                  Leaderboard {rankedResults.length > 0 && `(${rankedResults.length})`}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {totalSubmissions > 3 && (
                  <input
                    type="text"
                    placeholder="Search participant..."
                    value={searchLeaderboard}
                    onChange={e => setSearchLeaderboard(e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                )}
                {rankedResults.length > 0 && (
                  <button
                    type="button"
                    onClick={exportQuizLeaderboardCSV}
                    className={styles.filterBtn}
                    style={{ fontSize: '12px', padding: '6px 14px' }}>
                    ⬇ Export CSV
                  </button>
                )}
              </div>
            </div>

            {rankedResults.length === 0 ? (
              <div className={styles.emptyState} style={{ border: 'none', borderRadius: 0 }}>
                <div className={styles.emptyIcon}>🏆</div>
                <h3>No Submissions Yet</h3>
                <p>
                  {currentQuiz?.quizCode ? (
                    <>Share Quiz Code <strong>{currentQuiz.quizCode}</strong> with participants to start recording results.</>
                  ) : (
                    'Participants have not submitted any attempts for this quiz yet.'
                  )}
                </p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.leaderboardTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                      <th>Participant</th>
                      {selectedQuizId === 'all' && <th>Quiz</th>}
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Time</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedResults.map((r, index) => {
                      const name = r.user?.name || r.guestName || 'Guest Participant'
                      const email = r.user?.email || r.guestEmail || ''
                      const isGuest = !r.user
                      const avatarChar = name?.[0]?.toUpperCase() || '?'
                      const timeStr = r.timeTaken > 0
                        ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s`
                        : '—'

                      return (
                        <tr key={r._id || index}>
                          <td style={{ textAlign: 'center' }}>
                            {renderRankBadge(index + 1)}
                          </td>
                          <td>
                            <div className={styles.participantCell}>
                              <div
                                className={`${styles.participantAvatar} ${isGuest ? styles.participantAvatarGuest : ''}`}>
                                {avatarChar}
                              </div>
                              <div>
                                <div className={styles.participantName}>
                                  {name}
                                  <span className={`${styles.participantTag} ${isGuest ? styles.tagGuest : styles.tagStudent}`}>
                                    {isGuest ? 'Guest' : (r.user?.role || 'Student')}
                                  </span>
                                </div>
                                {email && <div className={styles.participantEmail}>{email}</div>}
                              </div>
                            </div>
                          </td>
                          {selectedQuizId === 'all' && (
                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {r.quiz?.title || 'Unknown Quiz'}
                              {r.quiz?.quizCode && (
                                <span className={styles.quizCodePillSmall} style={{ marginLeft: 6 }}>
                                  {r.quiz.quizCode}
                                </span>
                              )}
                            </td>
                          )}
                          <td>
                            <span className={`${styles.scoreBadge} ${getScoreColor(r.score)}`}>
                              <span className={styles.scoreEmoji}>{getScoreEmoji(r.score)}</span>
                              <span className={styles.scoreValue}>{r.score}%</span>
                            </span>
                          </td>
                          <td>
                            <strong>{r.correctAnswers}</strong> / {r.totalQuestions}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {timeStr}
                          </td>
                          <td style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                            {new Date(r.completedAt).toLocaleDateString()} at{' '}
                            {new Date(r.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'student' && (
        <>
          {studentList.length > 0 && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className={styles.statValue}>{adminStats.totalStudents}</div>
                <div className={styles.statLabel}>Total Participants</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className={styles.statValue}>{adminStats.totalAttempts}</div>
                <div className={styles.statLabel}>Total Attempts</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                </div>
                <div className={styles.statValue}>{adminStats.avgScore}%</div>
                <div className={styles.statLabel}>Average Score</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className={styles.statValue} style={{ fontSize: '16px' }}>
                  {adminStats.topStudent}
                </div>
                <div className={styles.statLabel}>Top Participant</div>
              </div>
            </div>
          )}

          {studentList.length > 0 && (
            <div className={styles.filterSection}>
              <div className={styles.filterLabel}>Filter by Avg Score:</div>
              <div className={styles.filterButtons}>
                {[
                  { key: 'all',       label: `All (${studentList.length})` },
                  { key: 'excellent', label: 'Excellent (≥80%)' },
                  { key: 'good',      label: 'Good (60-79%)' },
                  { key: 'needsWork', label: 'Needs Review' },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    className={`${styles.filterBtn} ${studentFilter === f.key ? styles.filterActive : ''}`}
                    onClick={() => setStudentFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredStudents.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No participants found</h3>
              <p>{studentFilter !== 'all' ? 'Try changing the filter' : 'No quiz attempts recorded yet.'}</p>
            </div>
          ) : (
            <div className={styles.studentList}>
              {filteredStudents.map(({ user: u, attempts, avgScore, best, isGuest }) => {
                const isOpen = expandedStudent === (u._id || u.email)
                return (
                  <div
                    key={u._id || u.email}
                    className={`${styles.studentCard} ${isOpen ? styles.studentCardOpen : ''}`}>

                    <div
                      className={styles.studentRow}
                      onClick={() => setExpandedStudent(isOpen ? null : (u._id || u.email))}>

                      <div
                        className={styles.studentAvatar}
                        style={isGuest ? { background: 'linear-gradient(135deg,#d97706,#f59e0b)' } : {}}>
                        {u.name?.[0]?.toUpperCase() || '?'}
                      </div>

                      <div className={styles.studentMeta}>
                        <div className={styles.studentName}>
                          {u.name}
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

                    {isOpen && (
                      <div className={styles.attemptsPanel}>
                        <div className={styles.attemptsPanelTitle}>
                          All Attempts by {u.name}
                        </div>
                        <div className={styles.attemptsGrid}>
                          {[...attempts]
                            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                            .map((result, i) => (
                              <div key={result._id || i} className={styles.attemptCard}>
                                <div className={styles.attemptHeader}>
                                  <span className={styles.attemptNum}>#{attempts.length - i}</span>
                                  <div className={`${styles.scoreBadge} ${getScoreColor(result.score)}`}>
                                    <span className={styles.scoreEmoji}>{getScoreEmoji(result.score)}</span>
                                    <span className={styles.scoreValue}>{result.score}%</span>
                                  </div>
                                </div>
                                <div className={styles.attemptQuizName}>
                                  {result.quiz?.title || 'Quiz'}
                                  {result.quiz?.quizCode && (
                                    <span className={styles.quizCodePillSmall} style={{ marginLeft: 6 }}>
                                      {result.quiz.quizCode}
                                    </span>
                                  )}
                                </div>
                                <div className={styles.resultDetails}>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailIcon}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                      </svg>
                                    </span>
                                    <span className={styles.detailText}>
                                      <strong>{result.correctAnswers}</strong> / <strong>{result.totalQuestions}</strong> correct
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
      )}
    </>
  )
}

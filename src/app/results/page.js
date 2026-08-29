'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import styles from './page.module.css'
import AdminResults   from '../components/results/AdminResults'
import StudentResults from '../components/results/StudentResults'

export default function Results() {
  const { user, loading } = useAuth()
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAdminRole = (role) => role === 'admin' || role === 'superadmin'

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

  // here are the shared helpers passed as props to both components
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

  const exportToCSV = () => {
    const headers = [
      'Student / Participant Name', 'Email', 'Role / Type', 'Quiz Title',
      'Score (%)', 'Correct', 'Total Questions', 'Time Taken', 'Date'
    ]
    const rows = results.map(r => {
      const name = r.user?.name || r.guestName || (user?.role === 'student' ? user?.name : 'Guest Participant')
      const email = r.user?.email || r.guestEmail || (user?.role === 'student' ? user?.email : 'N/A')
      const participantType = r.user ? (r.user.role || 'Student') : (r.guestName ? 'Guest' : 'Student')
      const quizTitle = r.quiz?.title || 'Unknown Quiz'
      const timeStr = r.timeTaken > 0 ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : '-'
      const dateStr = new Date(r.completedAt).toLocaleDateString() + ' ' +
        new Date(r.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      return [
        name,
        email,
        participantType,
        quizTitle,
        r.score,
        r.correctAnswers,
        r.totalQuestions,
        timeStr,
        dateStr
      ]
    })
    // Prepend \uFEFF (UTF-8 BOM) so Microsoft Excel opens it with correct UTF-8 encoding
    const csvContent = '\uFEFF' + [headers, ...rows]
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🎓</span>
          <div>
            <h1 className={styles.headerTitle} style={{ fontSize: '18px', margin: 0 }}>IntelliQuiz</h1>
            <span style={{ fontSize: '11.5px', color: 'var(--primary-300)', fontWeight: 600 }}>
              {isAdminRole(user.role) ? 'All Results & Analytics' : 'My Quiz Results'}
            </span>
          </div>
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name}</span>
          <button onClick={() => router.push('/')} className={styles.navBtn}>Home</button>
          {user.role === 'student' && (
            <button onClick={() => router.push('/student')} className={styles.navBtnPrimary}>
              Take Quiz
            </button>
          )}
          {isAdminRole(user.role) && (
            <button onClick={() => router.push('/admin')} className={styles.navBtnPrimary}>
              Admin Panel
            </button>
          )}
          {isAdminRole(user.role) && results.length > 0 && (
            <button onClick={exportToCSV} className={styles.navBtn}>
              ⬇ Export CSV
            </button>
          )}
        </div>
      </div>

      <div className={styles.resultsWrapper}>
        {isAdminRole(user.role) ? (
          <AdminResults
            results={results}
            getScoreColor={getScoreColor}
            getScoreEmoji={getScoreEmoji}
          />
        ) : (
          <StudentResults
            results={results}
            getScoreColor={getScoreColor}
            getScoreEmoji={getScoreEmoji}
          />
        )}
      </div>

    </div>
  )
}
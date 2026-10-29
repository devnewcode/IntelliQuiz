'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './AuthForm.module.css'

export default function AuthForm({ onLogin, onRegister, isSubmitting, error, success }) {
  const router = useRouter()
  // 3 dedicated, focused tabs: 'code' | 'login' | 'register'
  const [activeTab, setActiveTab] = useState('login')
  const [quizCode, setQuizCode] = useState('')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    username: '', password: '', name: '', email: ''
  })

  const handleLogin = (e) => {
    e.preventDefault()
    onLogin(loginForm)
  }

  const handleRegister = (e) => {
    e.preventDefault()
    onRegister(registerForm)
  }

  const handleJoinByCode = (e) => {
    e.preventDefault()
    const trimmed = quizCode.trim().toUpperCase()
    if (!trimmed) return
    router.push(`/play?code=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>

        {/* ── Header ── */}
        <div className={styles.authHeader}>
          <div className={styles.logoSection}>
            <div className={styles.logoBadge}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
              </svg>
            </div>
            <h1 className={styles.authTitle}>IntelliQuiz</h1>
          </div>
          <p className={styles.authSubtitle}>Smart Quizzing & Assessment Platform</p>
        </div>

        {/* ── 3 Clean Tabs ── */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'code' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('code')}>
            Enter Code
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'login' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('login')}>
            Log In
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'register' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('register')}>
            Sign Up
          </button>
        </div>

        {/* ── Alerts ── */}
        {error   && <div className={styles.errorAlert}>{error}</div>}
        {success && <div className={styles.successAlert}>{success}</div>}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 1: JOIN WITH QUIZ CODE                            */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'code' && (
          <form onSubmit={handleJoinByCode} className={styles.form}>
            <div className={styles.codePromptBox}>
              <h3 className={styles.codePromptTitle}>Have a Quiz Code?</h3>
              <p className={styles.codePromptSubtitle}>
                Enter the code shared by your teacher, team, or organizer to launch your quiz immediately.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Quiz Code</label>
              <input
                className={`${styles.input} ${styles.codeInputLarge}`}
                type="text"
                value={quizCode}
                onChange={e => setQuizCode(e.target.value.toUpperCase())}
                placeholder="e.g. IYF-GITA or X7K9P2"
                maxLength={12}
                autoFocus
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Join Quiz →
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 2: STUDENT LOGIN                                   */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                type="text"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                required
                disabled={isSubmitting}
                placeholder="Enter your username"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                disabled={isSubmitting}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log In to Dashboard →'}
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 3: CREATE ACCOUNT                                  */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                value={registerForm.name}
                onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
                disabled={isSubmitting}
                placeholder="Enter your full name"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={registerForm.email}
                onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
                disabled={isSubmitting}
                placeholder="Enter your email address"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                type="text"
                value={registerForm.username}
                onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
                disabled={isSubmitting}
                placeholder="Choose a username (min 3 characters)"
                minLength={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                value={registerForm.password}
                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                disabled={isSubmitting}
                placeholder="Create a password (min 6 characters)"
                minLength={6}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>
        )}

        {/* ── Clean Secondary Footer ── */}
        <div className={styles.authFooter}>
          <div className={styles.quickActionsRow}>
            <Link href="/play" className={styles.quickActionPill}>
              Public Quizzes
            </Link>
            <span className={styles.footerDot}>•</span>
            <Link href="/multiplayer" className={styles.quickActionPill}>
              Multiplayer Match
            </Link>
          </div>

          <div className={styles.adminRegisterLink}>
            Educator or Host? <Link href="/admin-register">Register as Admin</Link>
          </div>
        </div>

      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import styles from './AuthForm.module.css'

export default function AuthForm({ onLogin, onRegister, isSubmitting, error, success }) {
  const [activeTab, setActiveTab] = useState('login')
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

  const switchTab = (tab) => {
    setActiveTab(tab)
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>

        {/* ── Header ── */}
        <div className={styles.authHeader}>
          <div className={styles.logoSection}>
            <span className={styles.logoIcon}>🎓</span>
            <h1 className={styles.authTitle}>IntelliQuiz</h1>
          </div>
          <p className={styles.authSubtitle}>Smart Quizzing Platform</p>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'login' ? styles.activeTab : ''}`}
            onClick={() => switchTab('login')}>
            Login
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'register' ? styles.activeTab : ''}`}
            onClick={() => switchTab('register')}>
            Create Account
          </button>
        </div>

        {/* ── Alerts ── */}
        {error   && <div className={styles.errorAlert}>{error}</div>}
        {success && <div className={styles.successAlert}>{success}</div>}

        {/* ── Login Form ── */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input} type="text"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                required disabled={isSubmitting}
                placeholder="Enter your username" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input} type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required disabled={isSubmitting}
                placeholder="Enter your password" />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (

        /* ── Register Form ── */
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input} type="text"
                value={registerForm.name}
                onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                required disabled={isSubmitting}
                placeholder="Enter your full name" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input} type="email"
                value={registerForm.email}
                onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                required disabled={isSubmitting}
                placeholder="Enter your email address" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input} type="text"
                value={registerForm.username}
                onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                required disabled={isSubmitting}
                placeholder="Choose a username (min 3 characters)" minLength={3} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input} type="password"
                value={registerForm.password}
                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                required disabled={isSubmitting}
                placeholder="Create a password (min 6 characters)" minLength={6} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}


      </div>
    </div>
  )
}
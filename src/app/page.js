'use client'
import { useState } from 'react'
import { useAuth } from '../lib/authContext'
import styles from './page.module.css'

import AuthForm       from './components/AuthForm'
import WelcomeScreen  from './components/WelcomeScreen'
import AdminHome      from './components/AdminHome'
import StudentDashboard from './components/StudentDashboard'

export default function Home() {
  const { user, login, register, logout, loading } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  const isAdminRole = (role) => role === 'admin' || role === 'superadmin'

  
  const Navbar = () => (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <h1 className={styles.logo}>🎓 IntelliQuiz</h1>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{user.role}</span>
          <button onClick={logout} className={styles.logoutBtn}>Logout</button>
        </div>
      </div>
    </nav>
  )

  //Auth handlers - i put them here so they can call setError/setSuccess
  const handleLogin = async (formData) => {
    setError(''); setIsSubmitting(true)
    const result = await login(formData.username, formData.password)
    if (result.success) { setSuccess('Login successful!'); setShowWelcome(true) }
    else setError(result.error)
    setIsSubmitting(false)
  }

  const handleRegister = async (formData) => {
    setError(''); setSuccess(''); setIsSubmitting(true)
    const result = await register({ ...formData, role: 'student' })
    if (result.success) { setSuccess('Account created successfully!'); setShowWelcome(true) }
    else setError(result.error)
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    )
  }

  //  Student returning - goes straight to dashboard
  if (user && !isAdminRole(user.role) && !showWelcome) {
    return <StudentDashboard user={user} logout={logout} />
  }

  // Welcome screen - shown once after login for all roles
  if (user && showWelcome) {
    return (
      <div className={styles.container}>
        <Navbar />
        <WelcomeScreen
          user={user}
          onViewDashboard={() => setShowWelcome(false)}
        />
      </div>
    )
  }

  // Admin returning - simple panel with two buttons
  if (user && isAdminRole(user.role) && !showWelcome) {
    return (
      <div className={styles.container}>
        <Navbar />
        <AdminHome user={user} />
      </div>
    )
  }

  // Not logged in - show auth form
  return (
    <AuthForm
      onLogin={handleLogin}
      onRegister={handleRegister}
      isSubmitting={isSubmitting}
      error={error}
      success={success}
    />
  )
}
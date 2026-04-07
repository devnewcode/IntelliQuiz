'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/authContext'
import StudentDashboard from './components/StudentDashboard'
import styles from './page.module.css'

export default function Home() {
  const { user, login, register, logout, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    username: '', password: '', name: '', email: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setIsSubmitting(true)
    const result = await login(loginForm.username, loginForm.password)
    if (result.success) { setSuccess('Login successful!'); setShowWelcome(true) }
    else setError(result.error)
    setIsSubmitting(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setIsSubmitting(true)
    const result = await register({ ...registerForm, role: 'student' })
    if (result.success) { setSuccess('Account created successfully!'); setShowWelcome(true) }
    else setError(result.error)
    setIsSubmitting(false)
  }

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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    )
  }

  // ── STUDENT DASHBOARD — returning student skips welcome, goes straight here ──
  if (user && !isAdminRole(user.role) && !showWelcome) {
    return <StudentDashboard user={user} logout={logout} />
  }

  // ── WELCOME SCREEN — shown once after login for all roles ──
  if (user && showWelcome) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeCard}>
            <div className={styles.celebrationIcon}>🎉</div>
            <h2 className={styles.welcomeTitle}>Welcome to IntelliQuiz, {user.name}!</h2>
            <p className={styles.welcomeSubtitle}>You are logged in as <strong>{user.role}</strong></p>
            <div className={styles.actionButtons}>
              {isAdminRole(user.role) ? (
                <>
                  <button onClick={() => router.push('/admin')} className={styles.primaryBtn}>
                    <span className={styles.btnIcon}>⚙️</span>
                    {user.role === 'superadmin' ? 'Super Admin Panel' : 'Admin Panel'}
                  </button>
                  <button onClick={() => router.push('/results')} className={styles.secondaryBtn}>
                    <span className={styles.btnIcon}>📊</span> View All Results
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => router.push('/student')} className={styles.primaryBtn}>
                    <span className={styles.btnIcon}>📝</span> Take Quiz
                  </button>
                  <button onClick={() => setShowWelcome(false)} className={styles.secondaryBtn}>
                    <span className={styles.btnIcon}>📊</span> View Dashboard
                  </button>
                </>
              )}
            </div>
            {/* Continue button only for admin — students have dashboard button above */}
            {isAdminRole(user.role) && (
              <button onClick={() => router.push('/admin')} className={styles.continueBtn}>
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── ADMIN DASHBOARD — returning admin sees simple button panel ──
  if (user && isAdminRole(user.role) && !showWelcome) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.dashboardSection}>
          <h2>Welcome back, {user.name}!</h2>
          <p className={styles.roleText}>Logged in as <strong>{user.role}</strong></p>
          <div className={styles.actionButtons}>
            <button onClick={() => router.push('/admin')} className={styles.primaryBtn}>
              <span className={styles.btnIcon}>⚙️</span>
              {user.role === 'superadmin' ? 'Super Admin Panel' : 'Admin Panel'}
            </button>
            <button onClick={() => router.push('/results')} className={styles.secondaryBtn}>
              <span className={styles.btnIcon}>📊</span> View All Results
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── AUTH PAGE — not logged in ──
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logoSection}>
            <span className={styles.logoIcon}>🎓</span>
            <h1 className={styles.authTitle}>IntelliQuiz</h1>
          </div>
          <p className={styles.authSubtitle}>Smart Quizzing Platform</p>
        </div>

        <div className={styles.tabContainer}>
          <button className={`${styles.tab} ${activeTab === 'login' ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab('login'); setError(''); setSuccess('') }}>
            Login
          </button>
          <button className={`${styles.tab} ${activeTab === 'register' ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab('register'); setError(''); setSuccess('') }}>
            Create Account
          </button>
        </div>

        {error   && <div className={styles.errorAlert}>{error}</div>}
        {success && <div className={styles.successAlert}>{success}</div>}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input className={styles.input} type="text" value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                required disabled={isSubmitting} placeholder="Enter your username" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                required disabled={isSubmitting} placeholder="Enter your password" />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input className={styles.input} type="text" value={registerForm.name}
                onChange={e => setRegisterForm({...registerForm, name: e.target.value})}
                required disabled={isSubmitting} placeholder="Enter your full name" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" value={registerForm.email}
                onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                required disabled={isSubmitting} placeholder="Enter your email address" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input className={styles.input} type="text" value={registerForm.username}
                onChange={e => setRegisterForm({...registerForm, username: e.target.value})}
                required disabled={isSubmitting} placeholder="Choose a username (min 3 characters)" minLength={3} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" value={registerForm.password}
                onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                required disabled={isSubmitting} placeholder="Create a password (min 6 characters)" minLength={6} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>About IntelliQuiz</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>👨‍🎓</span>
              <div><strong>Students:</strong> Create your account to take quizzes and track your progress</div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>👨‍💼</span>
              <div><strong>Admins:</strong> Access the admin panel via the dedicated admin portal</div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🔒</span>
              <div>All data is securely stored in MongoDB Atlas</div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>💾</span>
              <div>Your progress and results are saved permanently</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
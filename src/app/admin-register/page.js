'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function AdminRegister() {
  const [form, setForm] = useState({
    name: '', email: '', username: '', password: '', adminCode: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setIsSubmitting(true)

    // Clear any existing token to prevent confusion
    localStorage.removeItem('token')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          username: form.username,
          password: form.password,
          role: 'admin',
          adminCode: form.adminCode  // sent to API for verification
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Do not save token or redirect - registration should not log in
        setSuccess('Admin account created successfully! Please log in to access the admin panel.')
        setTimeout(() => router.push('/'), 2000)
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>

        {/* Header */}
        <div className={styles.authHeader}>
          <div className={styles.logoSection}>
            <span className={styles.logoIcon}>🔐</span>
            <h1 className={styles.authTitle}>Admin Portal</h1>
          </div>
          <p className={styles.authSubtitle}>Restricted Access — IntelliQuiz</p>
        </div>

        {error   && <div className={styles.errorAlert}>{error}</div>}
        {success && <div className={styles.successAlert}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input className={styles.input} type="text" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required disabled={isSubmitting} placeholder="Enter your full name" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required disabled={isSubmitting} placeholder="Enter your email address" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input className={styles.input} type="text" value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              required disabled={isSubmitting} placeholder="Choose a username (min 3 characters)" minLength={3} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input className={styles.input} type="password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required disabled={isSubmitting} placeholder="Create a password (min 6 characters)" minLength={6} />
          </div>

          {/* Secret admin code field */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Admin Access Code</label>
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              value={form.adminCode}
              onChange={e => setForm({...form, adminCode: e.target.value})}
              required disabled={isSubmitting}
              placeholder="Enter admin access code" />
            <span className={styles.inputHint}
              style={{cursor:'pointer', userSelect:'none'}}
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈 Hide code' : '👁 Show code'}
            </span>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Admin Account...' : '🔐 Create Admin Account'}
          </button>
        </form>

        {/* Link back to main login */}
        <div className={styles.infoSection} style={{textAlign:'center'}}>
          <span style={{fontSize:'13px', color:'#64748b'}}>
            Not an admin?{' '}
            <span
              onClick={() => router.push('/')}
              style={{color:'#8b5cf6', cursor:'pointer', fontWeight:600}}>
              Go to Student Login →
            </span>
          </span>
        </div>

      </div>
    </div>
  )
}
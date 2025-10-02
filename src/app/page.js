'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/authContext'

export default function Home() {
  const { user, login, register, logout, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'student'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    
    const result = await login(loginForm.username, loginForm.password)
    
    if (result.success) {
      setSuccess('Login successful!')
      setShowWelcome(true)
    } else {
      setError(result.error)
    }
    setIsSubmitting(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    
    const result = await register(registerForm)
    
    if (result.success) {
      setSuccess('Account created successfully!')
      setShowWelcome(true)
    } else {
      setError(result.error)
    }
    setIsSubmitting(false)
  }

  const navigateToRole = () => {
    setShowWelcome(false)
    if (user.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/student')
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (user && showWelcome) {
    return (
      <div className="container">
        <div className="nav">
          <h1>IntelliQuiz Application</h1>
          <div className="user-info">
            Welcome, {user.name} ({user.role})
            <button onClick={logout}>Logout</button>
          </div>
          <div style={{ clear: 'both' }}></div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <div className="success" style={{ fontSize: '18px', marginBottom: '30px' }}>
            🎉 Welcome to IntelliQuiz, {user.name}!
          </div>
          
          <h2>You are logged in as {user.role}</h2>
          <p style={{ marginBottom: '30px' }}>Choose what you'd like to do:</p>
          
          {user.role === 'admin' ? (
            <div>
              <button 
                onClick={() => router.push('/admin')}
                style={{ fontSize: '16px', padding: '15px 30px', marginRight: '15px' }}
              >
                Go to Admin Panel
              </button>
              <button 
                onClick={() => router.push('/results')}
                style={{ fontSize: '16px', padding: '15px 30px' }}
              >
                View All Results
              </button>
            </div>
          ) : (
            <div>
              <button 
                onClick={() => router.push('/student')}
                style={{ fontSize: '16px', padding: '15px 30px', marginRight: '15px' }}
              >
                Take Quiz
              </button>
              <button 
                onClick={() => router.push('/results')}
                style={{ fontSize: '16px', padding: '15px 30px' }}
              >
                View My Results
              </button>
            </div>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <button 
              onClick={navigateToRole}
              className="btn-success"
              style={{ fontSize: '16px', padding: '15px 30px' }}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (user && !showWelcome) {
    return (
      <div className="container">
        <div className="nav">
          <h1>IntelliQuiz - Home</h1>
          <div className="user-info">
            {user.name} ({user.role})
            <button onClick={logout}>Logout</button>
          </div>
          <div style={{ clear: 'both' }}></div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2>Welcome back, {user.name}!</h2>
          <p>You are logged in as {user.role}</p>
          
          {user.role === 'admin' ? (
            <div>
              <button onClick={() => router.push('/admin')}>Admin Panel</button>
              <button onClick={() => router.push('/results')}>View All Results</button>
            </div>
          ) : (
            <div>
              <button onClick={() => router.push('/student')}>Take Quiz</button>
              <button onClick={() => router.push('/results')}>View My Results</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>IntelliQuiz - Welcome</h1>
      
      <div className="auth-tabs">
        <button 
          className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('login')
            setError('')
            setSuccess('')
          }}
        >
          Login
        </button>
        <button 
          className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('register')
            setError('')
            setSuccess('')
          }}
        >
          Create Account
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {activeTab === 'login' ? (
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              required
              disabled={isSubmitting}
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              required
              disabled={isSubmitting}
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
              required
              disabled={isSubmitting}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
              required
              disabled={isSubmitting}
              placeholder="Enter your email address"
            />
          </div>
          
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
              required
              disabled={isSubmitting}
              placeholder="Choose a username (min 3 characters)"
              minLength={3}
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
              required
              disabled={isSubmitting}
              placeholder="Create a password (min 6 characters)"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Role:</label>
            <select
              value={registerForm.role}
              onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
              disabled={isSubmitting}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      )}
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>About IntelliQuiz:</h3>
        <p>• <strong>Students:</strong> Create your account to take quizzes and track your progress</p>
        <p>• <strong>Admins:</strong> Create and manage quizzes, view all student results</p>
        <p>• All data is securely stored in MongoDB Atlas</p>
        <p>• Your progress and results are saved permanently</p>
      </div>
    </div>
  )
}
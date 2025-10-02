'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'

export default function Results() {
  const { user, loading } = useAuth()
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
    }
    fetchResults()
  }, [user, loading, router])

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (response.ok) {
        setResults(data.results)
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <div className="error">Access denied. Please login.</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="nav">
        <h1>{user.role === 'admin' ? 'All Quiz Results' : 'My Quiz Results'}</h1>
        <div className="user-info">
          {user.name}
          <button onClick={() => router.push('/')}>Home</button>
          {user.role === 'student' && (
            <button onClick={() => router.push('/student')}>Take Quiz</button>
          )}
          {user.role === 'admin' && (
            <button onClick={() => router.push('/admin')}>Admin Panel</button>
          )}
        </div>
        <div style={{ clear: 'both' }}></div>
      </div>

      {results.length === 0 ? (
        <div className="quiz-item">
          <p>No quiz results found.</p>
          {user.role === 'student' && (
            <button onClick={() => router.push('/student')}>Take Your First Quiz</button>
          )}
        </div>
      ) : (
        results.map((result) => (
          <div key={result._id} className="quiz-item">
            <h3>{result.quiz?.title || 'Quiz Title Not Available'}</h3>
            {user.role === 'admin' && result.user && (
              <p><strong>Student:</strong> {result.user.name} ({result.user.email})</p>
            )}
            <p><strong>Score:</strong> {result.score}%</p>
            <p><strong>Correct Answers:</strong> {result.correctAnswers} out of {result.totalQuestions}</p>
            {result.timeTaken > 0 && (
              <p><strong>Time Taken:</strong> {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
            )}
            <p><strong>Completed:</strong> {new Date(result.completedAt).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  )
}

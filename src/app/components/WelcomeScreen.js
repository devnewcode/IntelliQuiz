'use client'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'


export default function WelcomeScreen({ user, onViewDashboard }) {
  const router = useRouter()
  const isAdminRole = (role) => role === 'admin' || role === 'superadmin'

  return (
    <div className={styles.welcomeSection}>
      <div className={styles.welcomeCard}>
        <div className={styles.celebrationIcon}>🎉</div>
        <h2 className={styles.welcomeTitle}>
          Welcome to IntelliQuiz, {user.name}!
        </h2>
        <p className={styles.welcomeSubtitle}>
          You are logged in as <strong>{user.role}</strong>
        </p>

        <div className={styles.actionButtons}>
          {isAdminRole(user.role) ? (
            <>
              <button
                onClick={() => router.push('/admin')}
                className={styles.primaryBtn}>
                <span className={styles.btnIcon}>⚙️</span>
                {user.role === 'superadmin' ? 'Super Admin Panel' : 'Admin Panel'}
              </button>
              <button
                onClick={() => router.push('/results')}
                className={styles.secondaryBtn}>
                <span className={styles.btnIcon}>📊</span> View All Results
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/student')}
                className={styles.primaryBtn}>
                <span className={styles.btnIcon}>📝</span> Take Quiz
              </button>
              <button
                onClick={onViewDashboard}
                className={styles.secondaryBtn}>
                <span className={styles.btnIcon}>📊</span> View Dashboard
              </button>
            </>
          )}
        </div>

        {/* Continue button only for admin */}
        {isAdminRole(user.role) && (
          <button
            onClick={() => router.push('/admin')}
            className={styles.continueBtn}>
            Continue →
          </button>
        )}
      </div>
    </div>
  )
}
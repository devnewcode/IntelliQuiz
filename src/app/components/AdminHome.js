'use client'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'


export default function AdminHome({ user }) {
  const router = useRouter()

  return (
    <div className={styles.dashboardSection}>
      <h2>Welcome back, {user.name}!</h2>
      <p className={styles.roleText}>
        Logged in as <strong>{user.role}</strong>
      </p>
      <div className={styles.actionButtons}>
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
      </div>
    </div>
  )
}
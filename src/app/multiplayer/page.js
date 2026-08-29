'use client'
import Link from 'next/link'
import styles from './multiplayer.module.css'

export default function MultiplayerLandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: '640px' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px', animation: 'float 3s ease-in-out infinite' }}>🎓</div>
          <h1 className={styles.title} style={{ marginBottom: '6px' }}>IntelliQuiz Live</h1>
          <p className={styles.subtitle} style={{ margin: 0 }}>
            Play real-time multiplayer quizzes with classmates & friends with live synchronized countdowns and leaderboards!
          </p>
        </div>

        <div className={styles.featureBadgesRow}>
          <span className={styles.featureBadge}>⚡ Real-Time Sync</span>
          <span className={styles.featureBadge}>🏆 Live Leaderboard</span>
          <span className={styles.featureBadge}>🥇 3D Podium</span>
        </div>

        <div className={styles.hubGrid}>
          <Link href="/multiplayer/host" className={styles.hubCard}>
            <div className={styles.hubIcon}>👑</div>
            <div className={styles.hubInfo}>
              <h3 className={styles.hubTitle}>Host a Live Game</h3>
              <p className={styles.hubDesc}>
                Create a room code, select a quiz, and host a live match on the big screen.
              </p>
            </div>
            <span className={styles.hubArrow}>→</span>
          </Link>

          <Link href="/multiplayer/join" className={styles.hubCard}>
            <div className={styles.hubIcon}>🚀</div>
            <div className={styles.hubInfo}>
              <h3 className={styles.hubTitle}>Join with Room Code</h3>
              <p className={styles.hubDesc}>
                Enter the 6-character code given by your teacher or host to join the room.
              </p>
            </div>
            <span className={styles.hubArrow}>→</span>
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/" style={{ color: 'var(--primary-400)', fontSize: '13.5px', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  )
}

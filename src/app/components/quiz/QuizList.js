'use client'
import styles from '../../student/page.module.css'

// this quiz list component basically:
// shows the grid of available quizzes, and
// have props:
//   quizzes      — array of quiz objects from API
//   onStartQuiz  — called when student clicks "Start Quiz"
//   user         — current user object (for nav display)
//   onGoHome     — navigate to home
//   onGoResults  — navigate to results page

export default function QuizList({ quizzes, onStartQuiz, user, onGoHome, onGoResults }) {
  const getDifficultyTag = (d) =>
    d === 'easy' ? styles.metaTagGreen :
    d === 'hard' ? styles.metaTagRed :
    styles.metaTagAmber

  return (
    <div className={styles.container}>

      {/* Nav */}
      <div className={styles.nav}>
        <h1 className={styles.navTitle}>Available Quizzes</h1>
        <div className={styles.navRight}>
          <span className={styles.navUser}>{user.name}</span>
          <button className={styles.navBtn} onClick={onGoHome}>Home</button>
          <button className={styles.navBtn} onClick={onGoResults}>My Results</button>
        </div>
      </div>

      {/* Empty state */}
      {quizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>No quizzes available yet</div>
          <div className={styles.emptyText}>
            Check back later — your admin will add quizzes soon!
          </div>
        </div>
      ) : (
        <div className={styles.quizGrid}>
          {quizzes.map(quiz => (
            <div key={quiz._id} className={styles.quizCard}>
              <h3 className={styles.quizCardTitle}>{quiz.title}</h3>
              {quiz.description && (
                <p className={styles.quizCardDesc}>{quiz.description}</p>
              )}
              <div className={styles.quizMeta}>
                <span className={`${styles.metaTag} ${getDifficultyTag(quiz.difficulty)}`}>
                  {quiz.difficulty}
                </span>
                <span className={styles.metaTag}>{quiz.category}</span>
                <span className={styles.metaTag}>
                  📝 {quiz.questions?.length || 0} questions
                </span>
                <span className={styles.metaTag}>
                  {quiz.timerEnabled ? `⏰ ${quiz.timeLimit} min` : '∞ No timer'}
                </span>
              </div>
              <button
                className={styles.startBtn}
                onClick={() => onStartQuiz(quiz)}>
                Start Quiz →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
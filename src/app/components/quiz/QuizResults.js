'use client'
import styles from '../../student/page.module.css'

// this quizresults component:
// Shows score card, review answers, and AI explanations.
// it have these props:
//   quiz                  — selected quiz object
//   score                 — final score percentage
//   correctAnswersCount   — number of correct answers
//   answers               — { questionId: selectedOptionIndex }
//   timeTaken             — seconds taken
//   timeExpired           — boolean
//   explanations          — [{ questionId, explanation }] from Gemini
//   isFetchingExplanations — boolean
//   user                  — current user
//   onTakeAnother         — go back to quiz list
//   onViewResults         — navigate to /results page
//   onGoHome              — navigate to /
//   onGoAllResults        — navigate to /results

export default function QuizResults({
  quiz,
  score,
  correctAnswersCount,
  answers,
  timeTaken,
  timeExpired,
  explanations,
  isFetchingExplanations,
  user,
  onTakeAnother,
  onViewResults,
  onGoHome,
  onGoAllResults,
}) {
  const getScoreEmoji = (s) =>
    s >= 80 ? '🏆' : s >= 60 ? '⭐' : s >= 40 ? '👍' : '📚'

  return (
    <div className={styles.container}>

      {/* Nav */}
      <div className={styles.nav}>
        <h1 className={styles.navTitle}>Quiz Results</h1>
        <div className={styles.navRight}>
          <span className={styles.navUser}>{user.name}</span>
          <button className={styles.navBtn} onClick={onGoHome}>Home</button>
          <button className={styles.navBtn} onClick={onGoAllResults}>All Results</button>
        </div>
      </div>

      {/* Score card */}
      <div className={styles.scoreCard}>
        <div className={styles.scoreEmoji}>
          {timeExpired ? '⏰' : getScoreEmoji(score)}
        </div>
        <div className={styles.scoreTitle}>
          {timeExpired ? 'Time Expired!' : 'Quiz Completed!'}
        </div>
        <div className={styles.scoreQuiz}>{quiz.title}</div>
        <div className={styles.scoreBig}>{score}%</div>
        <div className={styles.scoreStats}>
          <div className={styles.scoreStat}>
            <span className={styles.scoreStatVal}>{correctAnswersCount}</span>
            <span className={styles.scoreStatLbl}>Correct</span>
          </div>
          <div className={styles.scoreStat}>
            <span className={styles.scoreStatVal}>
              {quiz.questions.length - correctAnswersCount}
            </span>
            <span className={styles.scoreStatLbl}>Wrong</span>
          </div>
          <div className={styles.scoreStat}>
            <span className={styles.scoreStatVal}>
              {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
            </span>
            <span className={styles.scoreStatLbl}>Time Taken</span>
          </div>
        </div>
        <div className={styles.scoreActions}>
          <button className={styles.btnPrimary} onClick={onTakeAnother}>
            Take Another Quiz
          </button>
          <button className={styles.btnOutline} onClick={onViewResults}>
            View All Results
          </button>
        </div>
      </div>

      {/* Review answers */}
      {!timeExpired && (
        <>
          <div className={styles.reviewTitle}>Review Answers</div>

          {/* AI explanations loading banner */}
          {isFetchingExplanations && (
            <div className={styles.alertWarning} style={{ textAlign: 'center', marginBottom: 16 }}>
              ✨ Please wait, we are generating explanations for your wrong answers...
            </div>
          )}

          {quiz.questions.map((q, i) => {
            const qid = q._id || q.id || i.toString()
            const userAnswer = answers[qid]
            const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer
            const explanationObj = explanations.find(e => e.questionId === qid)

            return (
              <div key={qid} className={styles.reviewCard}>
                <div className={styles.reviewQuestion}>Q{i + 1}: {q.question}</div>

                {q.options?.map((opt, j) => (
                  <div
                    key={j}
                    className={`${styles.reviewOption} ${
                      j === q.correctAnswer ? styles.reviewCorrect :
                      j === userAnswer && !isCorrect ? styles.reviewWrong :
                      styles.reviewNeutral
                    }`}>
                    {j === q.correctAnswer ? '✓' :
                     j === userAnswer && !isCorrect ? '✗' : '○'} {opt}
                    {j === q.correctAnswer && ' (Correct)'}
                    {j === userAnswer && j !== q.correctAnswer && ' (Your answer)'}
                  </div>
                ))}

                {userAnswer === undefined && (
                  <div className={styles.reviewUnanswered}>⚠️ Not answered</div>
                )}

                {/* AI explanation — only on wrong answers */}
                {!isCorrect && userAnswer !== undefined && (
                  <div className={styles.aiExplanation}>
                    <span className={styles.aiExplanationLabel}>✨ Explanation</span>
                    {explanationObj ? (
                      <p className={styles.aiExplanationText}>
                        {explanationObj.explanation}
                      </p>
                    ) : isFetchingExplanations ? (
                      <p className={styles.aiExplanationText} style={{ opacity: 0.5 }}>
                        Loading...
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* Time expired message */}
      {timeExpired && (
        <div className={styles.alertExpired}>
          ⏰ Quiz timed out — all answers marked incorrect. Try again within the time limit!
        </div>
      )}
    </div>
  )
}
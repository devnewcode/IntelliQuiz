'use client'
import { useState } from 'react'
import styles from '../../student/page.module.css'

// Enhanced QuizResults component with performance grades, speed metrics,
// and mistake-focused answer review filtering.
// Props:
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
  explanations = [],
  isFetchingExplanations,
  user,
  onTakeAnother,
  onViewResults,
  onGoHome,
  onGoAllResults,
}) {
  const totalQuestions = quiz?.questions?.length || 0
  const wrongAnswersCount = totalQuestions - correctAnswersCount

  // Automatically default to "mistakes" filter if student had wrong answers, otherwise "all"
  const [reviewFilter, setReviewFilter] = useState(wrongAnswersCount > 0 ? 'mistakes' : 'all')

  const getScoreEmoji = (s) =>
    s >= 90 ? '🏆' : s >= 80 ? '⭐' : s >= 60 ? '👍' : s >= 40 ? '📚' : '💪'

  const getGradeInfo = (s) => {
    if (s >= 90) return { grade: 'Grade A+', label: 'Outstanding Mastery' }
    if (s >= 80) return { grade: 'Grade A', label: 'Excellent Performance' }
    if (s >= 60) return { grade: 'Grade B', label: 'Good Understanding' }
    if (s >= 40) return { grade: 'Grade C', label: 'Passing Score' }
    return { grade: 'Needs Review', label: 'Keep Practicing' }
  }

  const gradeInfo = getGradeInfo(score)
  const avgTimePerQuestion = timeTaken > 0 && totalQuestions > 0 ? Math.round(timeTaken / totalQuestions) : null

  // Filtered review questions
  const filteredQuestions = (quiz?.questions || []).filter(q => {
    const qid = q._id || q.id || quiz.questions.indexOf(q).toString()
    const userAnswer = answers[qid]
    const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer

    if (reviewFilter === 'mistakes') return !isCorrect
    if (reviewFilter === 'correct') return isCorrect
    return true
  })

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
        <div className={styles.scoreQuiz}>{quiz?.title}</div>

        {/* Big Score Percentage + Grade Badge */}
        <div className={styles.scoreBig}>{score}%</div>

        <div className={styles.gradeBadge}>
          <span>{gradeInfo.grade}</span>
          <span className={styles.gradeLabel}>• {gradeInfo.label}</span>
        </div>

        {/* 4 Metrics Stats Grid */}
        <div className={styles.scoreStats}>
          <div className={styles.scoreStat}>
            <span className={styles.scoreStatVal}>{correctAnswersCount}</span>
            <span className={styles.scoreStatLbl}>Correct</span>
          </div>
          <div className={styles.scoreStat}>
            <span className={styles.scoreStatVal}>{wrongAnswersCount}</span>
            <span className={styles.scoreStatLbl}>Wrong</span>
          </div>
          <div className={styles.scoreStat}>
            <span className={styles.scoreStatVal}>
              {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
            </span>
            <span className={styles.scoreStatLbl}>Total Time</span>
          </div>
          {avgTimePerQuestion && (
            <div className={styles.scoreStat}>
              <span className={styles.scoreStatVal}>~{avgTimePerQuestion}s</span>
              <span className={styles.scoreStatLbl}>Avg / Q</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.scoreActions}>
          <button className={styles.btnPrimary} onClick={onTakeAnother}>
            Take Another Quiz
          </button>
          <button className={styles.btnOutline} onClick={onViewResults}>
            View All Results
          </button>
        </div>
      </div>

      {/* Review answers section */}
      {!timeExpired && (
        <>
          <div className={styles.reviewHeaderRow}>
            <h3 className={styles.reviewTitle}>Review Questions & Answers</h3>

            {/* Filter Pills */}
            <div className={styles.reviewFilterPills}>
              <button
                type="button"
                className={`${styles.reviewPill} ${reviewFilter === 'all' ? styles.reviewPillActive : ''}`}
                onClick={() => setReviewFilter('all')}>
                📋 All ({totalQuestions})
              </button>
              <button
                type="button"
                className={`${styles.reviewPill} ${reviewFilter === 'mistakes' ? styles.reviewPillActive : ''}`}
                onClick={() => setReviewFilter('mistakes')}>
                ❌ Mistakes ({wrongAnswersCount})
              </button>
              <button
                type="button"
                className={`${styles.reviewPill} ${reviewFilter === 'correct' ? styles.reviewPillActive : ''}`}
                onClick={() => setReviewFilter('correct')}>
                ✅ Correct ({correctAnswersCount})
              </button>
            </div>
          </div>

          {/* AI explanations loading banner */}
          {isFetchingExplanations && (
            <div className={styles.alertWarning} style={{ textAlign: 'center', marginBottom: 16 }}>
              ✨ Generating AI explanations for your wrong answers...
            </div>
          )}

          {/* Empty filtered results */}
          {filteredQuestions.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '36px 20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {reviewFilter === 'mistakes'
                  ? 'Perfect score! You made zero mistakes on this quiz.'
                  : 'No questions in this filter.'}
              </p>
              <button
                type="button"
                className={styles.navBtn}
                style={{ marginTop: '12px' }}
                onClick={() => setReviewFilter('all')}>
                View All Questions
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const qid = q._id || q.id || quiz.questions.indexOf(q).toString()
              const realIndex = quiz.questions.indexOf(q)
              const userAnswer = answers[qid]
              const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer
              const explanationObj = explanations.find(e => e.questionId === qid)

              return (
                <div key={qid} className={styles.reviewCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className={styles.questionNum}>Question {realIndex + 1}</span>
                    <span className={`${styles.metaTag} ${isCorrect ? styles.metaTagGreen : styles.metaTagRed}`}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>

                  <div className={styles.reviewQuestion}>{q.question}</div>

                  <div className={styles.optionsList}>
                    {q.options?.map((opt, j) => (
                      <div
                        key={j}
                        className={`${styles.reviewOption} ${
                          j === q.correctAnswer ? styles.reviewCorrect :
                          j === userAnswer && !isCorrect ? styles.reviewWrong :
                          styles.reviewNeutral
                        }`}>
                        <span>
                          {j === q.correctAnswer ? '✓' :
                           j === userAnswer && !isCorrect ? '✗' : '○'} {opt}
                        </span>
                        {j === q.correctAnswer && <span style={{ fontWeight: 800, fontSize: '12px' }}>(Correct Answer)</span>}
                        {j === userAnswer && j !== q.correctAnswer && <span style={{ fontWeight: 800, fontSize: '12px' }}>(Your Answer)</span>}
                      </div>
                    ))}
                  </div>

                  {userAnswer === undefined && (
                    <div className={styles.reviewUnanswered}>⚠️ Not answered</div>
                  )}

                  {/* AI explanation — only on wrong answers */}
                  {!isCorrect && userAnswer !== undefined && (
                    <div className={styles.aiExplanation}>
                      <span className={styles.aiExplanationLabel}>✨ AI Concept Explanation</span>
                      {explanationObj ? (
                        <p className={styles.aiExplanationText}>
                          {explanationObj.explanation}
                        </p>
                      ) : isFetchingExplanations ? (
                        <p className={styles.aiExplanationText} style={{ opacity: 0.5 }}>
                          Loading explanation...
                        </p>
                      ) : (
                        <p className={styles.aiExplanationText}>
                          Review this concept carefully to improve your score next time.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </>
      )}

      {/* Time expired message */}
      {timeExpired && (
        <div className={styles.alertExpired}>
          ⏰ Quiz timed out — try again to complete all questions within the time limit!
        </div>
      )}
    </div>
  )
}
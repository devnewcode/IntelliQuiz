"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import styles from "../../multiplayer.module.css";

// picks an initial + a cycling avatar color for a player name
function getInitial(name) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}
function getAvatarClass(index) {
  return styles[`avatar${index % 6}`];
}

export default function HostRoomPage() {
  const { code } = useParams();
  const router = useRouter();

  const [room, setRoom] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");

  const [question, setQuestion] = useState(null);
  const [lastQuestionFull, setLastQuestionFull] = useState(null); // kept just for the correct-answer text
  const [lastQuestionMeta, setLastQuestionMeta] = useState(null); // { index, total } of the last question shown
  const [answerCount, setAnswerCount] = useState({ answeredCount: 0, totalPlayers: 0 });
  const [questionResult, setQuestionResult] = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState(null);
  const [finishReason, setFinishReason] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null); // countdown for the current question
  const [roomClosed, setRoomClosed] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const hostId = sessionStorage.getItem(`mp_host_${code}`);

    // reattaches this browser as the host after a refresh or dropped connection
    function attemptRejoin() {
      if (!hostId) {
        setRoomClosed(true); // no saved session at all - can't be this room's host
        return;
      }
      socket.emit("host:rejoin-room", { roomCode: code, hostId }, (res) => {
        if (res.ok) setRoom(res.room);
        else setRoomClosed(true); // e.g. room already expired while we were away
      });
    }
    attemptRejoin();
    socket.on("connect", attemptRejoin);

    // pull the host's existing quizzes to pick one to run
    fetch("/api/quizzes")
      .then((res) => res.json())
      .then((data) => setQuizzes(Array.isArray(data) ? data : data.quizzes || []))
      .catch(() => {});

    function onRoomUpdate({ room }) { setRoom(room); }
    function onQuestion(q) {
      setQuestion(q);
      setLastQuestionFull(q);
      setLastQuestionMeta({ index: q.index, total: q.totalQuestions });
      setQuestionResult(null);
      setAnswerCount({ answeredCount: 0, totalPlayers: room?.players?.length || 0 });
    }
    function onAnswerCount(data) { setAnswerCount(data); }
    function onQuestionResult(data) {
      setQuestionResult(data);
      setQuestion(null);
    }
    function onFinished(data) {
      setQuestion(null);
      setQuestionResult(null);
      setFinalLeaderboard(data.leaderboard);
      setFinishReason(data.reason);
    }
    function onRoomClosed() { setRoomClosed(true); }

    socket.on("room:update", onRoomUpdate);
    socket.on("quiz:question", onQuestion);
    socket.on("room:answer-count", onAnswerCount);
    socket.on("quiz:question-result", onQuestionResult);
    socket.on("quiz:finished", onFinished);
    socket.on("room:closed", onRoomClosed);

    return () => {
      socket.off("connect", attemptRejoin);
      socket.off("room:update", onRoomUpdate);
      socket.off("quiz:question", onQuestion);
      socket.off("room:answer-count", onAnswerCount);
      socket.off("quiz:question-result", onQuestionResult);
      socket.off("quiz:finished", onFinished);
      socket.off("room:closed", onRoomClosed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ticks the on-screen countdown down every second for the current question
  useEffect(() => {
    if (!question) return;
    setSecondsLeft(question.timeLimitSec);

    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [question]);

  // tells the server which quiz to run - the server looks up the real
  // questions itself instead of trusting them from the browser
  function handleStartQuiz() {
    const socket = getSocket();
    if (!selectedQuizId) return;

    socket.emit("host:start-quiz", { roomCode: code, quizId: selectedQuizId }, (res) => {
      if (!res.ok) alert(res.error);
    });
  }

  function handleNextQuestion() {
    const socket = getSocket();
    socket.emit("host:next-question", { roomCode: code }, (res) => {
      if (!res.ok) alert(res.error);
    });
  }

  function handleEndGame() {
    if (!confirm("End the quiz now? Everyone will see the leaderboard as final.")) return;
    const socket = getSocket();
    socket.emit("host:end-game", { roomCode: code }, (res) => {
      if (!res.ok) alert(res.error);
    });
  }

  function handleKick(playerId, name) {
    if (!confirm(`Remove ${name} from the room?`)) return;
    const socket = getSocket();
    socket.emit("host:kick-player", { roomCode: code, playerId }, (res) => {
      if (!res.ok) alert(res.error);
    });
  }

  function goBackToMultiplayer() {
    sessionStorage.removeItem(`mp_host_${code}`);
    router.push("/multiplayer");
  }

  const showLobby = !question && !questionResult && !finalLeaderboard;
  const gameInProgress = question || questionResult;
  const isLastQuestion = lastQuestionMeta && lastQuestionMeta.index + 1 >= lastQuestionMeta.total;
  const connectedCount = room?.players?.filter((p) => p.connected).length || 0;

  const timerRatio = question && secondsLeft != null ? secondsLeft / question.timeLimitSec : 1;
  const timerState = secondsLeft <= 5 ? "danger" : timerRatio <= 0.4 ? "warn" : "normal";
  const timerFillClass = [styles.timerFill, timerState === "danger" ? styles.timerFillDanger : timerState === "warn" ? styles.timerFillWarn : ""].join(" ");
  const timerCountClass = [styles.timerCount, timerState === "danger" ? styles.timerCountDanger : timerState === "warn" ? styles.timerCountWarn : ""].join(" ");

  if (roomClosed) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Room closed</h1>
          <p className={styles.waitingText} style={{ marginBottom: 20 }}>This room is no longer active.</p>
          <button onClick={goBackToMultiplayer} className={styles.buttonSecondary}>Back to multiplayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Room</h1>
        <div className={styles.roomCode}>{code}</div>

        {showLobby && (
          <>
            <p className={styles.sectionLabel}>
              Players ({room?.players?.length || 0}{room?.maxPlayers ? ` / ${room.maxPlayers}` : ""})
            </p>
            <ul className={styles.list}>
              {room?.players?.length
                ? room.players.map((p, i) => (
                    <li key={p.id} className={styles.playerRow}>
                      <span className={styles.playerRowLeft}>
                        <span className={`${styles.avatar} ${getAvatarClass(i)}`}>{getInitial(p.name)}</span>
                        <span className={styles.playerName}>
                          {p.name}
                          {!p.connected && <span className={styles.incorrectText}> (reconnecting...)</span>}
                        </span>
                      </span>
                      <button onClick={() => handleKick(p.id, p.name)} className={styles.kickBtn}>
                        Remove
                      </button>
                    </li>
                  ))
                : <li className={styles.emptyText}>Waiting for players...</li>}
            </ul>

            <div className={styles.form}>
              <select
                className={styles.select}
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
              >
                <option value="">Select a quiz</option>
                {quizzes.map((q) => (
                  <option key={q._id} value={q._id}>{q.title}</option>
                ))}
              </select>

              <button
                onClick={handleStartQuiz}
                disabled={!selectedQuizId || !room?.players?.length}
                className={styles.button}
              >
                Start quiz
              </button>
            </div>
          </>
        )}

        {question && (
          <div>
            <p className={styles.compactStatus}>{connectedCount} players connected</p>
            <div className={styles.timerRow}>
              <p className={styles.questionMeta}>Question {question.index + 1} / {question.totalQuestions}</p>
              <span className={timerCountClass}>{secondsLeft}s</span>
            </div>
            <div className={styles.timerBar}>
              <div
                className={timerFillClass}
                style={{ width: `${(secondsLeft / question.timeLimitSec) * 100}%` }}
              />
            </div>
            <h2 className={styles.questionText}>{question.text}</h2>
            <p className={styles.waitingText}>{answerCount.answeredCount} / {answerCount.totalPlayers} answered</p>
          </div>
        )}

        {questionResult && (
          <div>
            {lastQuestionFull && (
              <div className={styles.correctCard}>
                <span className={styles.correctIcon}>✓</span>
                <div>
                  <p className={styles.correctCardLabel}>Correct answer</p>
                  <p className={styles.correctCardText}>
                    {lastQuestionFull.options[questionResult.correctIndex]}
                  </p>
                </div>
              </div>
            )}
            <p className={styles.sectionLabel}>Results</p>
            <ul className={styles.list}>
              {Object.values(questionResult.results).map((r, i) => (
                <li key={i} className={styles.resultRow} style={{ animationDelay: `${i * 40}ms` }}>
                  <span className={styles.resultLeft}>
                    <span className={`${styles.avatar} ${getAvatarClass(i)}`}>{getInitial(r.name)}</span>
                    <span className={styles.resultName}>{r.name}</span>
                  </span>
                  <span className={`${styles.pointsBadge} ${r.isCorrect ? styles.pointsPositive : styles.pointsZero}`}>
                    {r.isCorrect ? `+${r.pointsEarned}` : "0"}
                  </span>
                </li>
              ))}
            </ul>
            <p className={styles.sectionLabel}>Leaderboard</p>
            <ol className={styles.leaderboard}>
              {questionResult.leaderboard.map((p, i) => (
                <li key={i} className={styles.leaderboardItem}>
                  <span className={`${styles.avatar} ${getAvatarClass(i)}`}>{getInitial(p.name)}</span>
                  <span className={styles.leaderboardName}>{p.name}</span>
                  <span className={styles.score}>{p.score}</span>
                </li>
              ))}
            </ol>
            <button onClick={handleNextQuestion} className={styles.button} style={{ marginTop: 16 }}>
              {isLastQuestion ? "View final results" : "Next question"}
            </button>
          </div>
        )}

        {gameInProgress && (
          <button onClick={handleEndGame} className={styles.buttonSecondary} style={{ marginTop: 12 }}>
            End quiz now
          </button>
        )}

        {finalLeaderboard && (
          <div>
            {finishReason === "ended-early" && (
              <p className={styles.waitingText} style={{ marginBottom: 12 }}>You ended the quiz early.</p>
            )}
            {finishReason === "all-players-left" && (
              <p className={styles.waitingText} style={{ marginBottom: 12 }}>Quiz ended automatically - all players left.</p>
            )}
            <p className={styles.sectionLabel}>Final results</p>

            {finalLeaderboard.length > 0 && (
              <p className={styles.winnerBanner}>🏆 {finalLeaderboard[0].name} wins!</p>
            )}

            {finalLeaderboard.length >= 2 && (
              <div className={styles.podium}>
                {[finalLeaderboard[1], finalLeaderboard[0], finalLeaderboard[2]].map((p, i) =>
                  p ? (
                    <div key={i} className={styles.podiumSpot} style={{ animationDelay: `${i * 100}ms` }}>
                      <div className={styles.podiumAvatar} style={{ background: i === 1 ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : i === 0 ? "linear-gradient(135deg,#cbd5e1,#94a3b8)" : "linear-gradient(135deg,#d97706,#92400e)" }}>
                        {getInitial(p.name)}
                      </div>
                      <p className={styles.podiumName}>{p.name}</p>
                      <p className={styles.podiumScore}>{p.score}</p>
                      <div className={`${styles.podiumBar} ${i === 1 ? styles.podiumBar1 : i === 0 ? styles.podiumBar2 : styles.podiumBar3}`}>
                        {i === 1 ? "🥇" : i === 0 ? "🥈" : "🥉"}
                      </div>
                    </div>
                  ) : <div key={i} style={{ flex: 1 }} />
                )}
              </div>
            )}

            <ol className={styles.leaderboard} style={finalLeaderboard.length >= 2 ? { counterReset: "rank 3" } : undefined}>
              {(finalLeaderboard.length >= 2 ? finalLeaderboard.slice(3) : finalLeaderboard).map((p, i) => (
                <li key={i} className={styles.leaderboardItem}>
                  <span className={`${styles.avatar} ${getAvatarClass(i + 3)}`}>{getInitial(p.name)}</span>
                  <span className={styles.leaderboardName}>{p.name}</span>
                  <span className={styles.score}>{p.score}</span>
                </li>
              ))}
            </ol>
            <button onClick={goBackToMultiplayer} className={styles.button} style={{ marginTop: 16 }}>
              Back to multiplayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

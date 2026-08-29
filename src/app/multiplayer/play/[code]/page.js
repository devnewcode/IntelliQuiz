"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import styles from "../../multiplayer.module.css";

function getInitial(name) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}
function getAvatarClass(index) {
  return styles[`avatar${index % 6}`];
}

export default function PlayPage() {
  const { code } = useParams();
  const router = useRouter();

  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [questionResult, setQuestionResult] = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState(null);
  const [finishReason, setFinishReason] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null); // countdown for the current question
  const [hostDisconnected, setHostDisconnected] = useState(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const [kicked, setKicked] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    // rejoins this room using the id saved on first join - covers both
    // a page refresh and the socket auto-reconnecting after a drop
    function attemptJoin() {
      const savedPlayerId = sessionStorage.getItem(`mp_player_${code}`);
      const savedName = sessionStorage.getItem(`mp_name_${code}`);
      if (!savedPlayerId && !savedName) return;

      socket.emit("player:join-room", { roomCode: code, playerId: savedPlayerId, playerName: savedName }, (res) => {
        if (res.ok) sessionStorage.setItem(`mp_player_${code}`, res.playerId);
      });
    }
    attemptJoin();
    socket.on("connect", attemptJoin);

    function onQuestion(q) {
      setQuestion(q);
      setSelected(null);
      setSubmitted(false);
      setQuestionResult(null);
    }
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
    function onHostDisconnected() { setHostDisconnected(true); }
    function onHostRejoined() { setHostDisconnected(false); }
    function onRoomClosed() { setRoomClosed(true); }
    function onKicked() {
      sessionStorage.removeItem(`mp_player_${code}`);
      sessionStorage.removeItem(`mp_name_${code}`);
      setKicked(true);
    }

    socket.on("quiz:question", onQuestion);
    socket.on("quiz:question-result", onQuestionResult);
    socket.on("quiz:finished", onFinished);
    socket.on("room:host-disconnected", onHostDisconnected);
    socket.on("room:host-reconnected", onHostRejoined);
    socket.on("room:closed", onRoomClosed);
    socket.on("room:kicked", onKicked);

    return () => {
      socket.off("connect", attemptJoin);
      socket.off("quiz:question", onQuestion);
      socket.off("quiz:question-result", onQuestionResult);
      socket.off("quiz:finished", onFinished);
      socket.off("room:host-disconnected", onHostDisconnected);
      socket.off("room:host-reconnected", onHostRejoined);
      socket.off("room:closed", onRoomClosed);
      socket.off("room:kicked", onKicked);
    };
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

  // locks in the picked option and sends it to the server
  function handleAnswer(index) {
    if (submitted) return;
    setSelected(index);
    setSubmitted(true);

    const socket = getSocket();
    socket.emit("player:submit-answer", { roomCode: code, answerIndex: index }, (res) => {
      if (!res.ok) console.warn(res.error);
    });
  }

  function goBackToMultiplayer() {
    sessionStorage.removeItem(`mp_player_${code}`);
    sessionStorage.removeItem(`mp_name_${code}`);
    router.push("/multiplayer");
  }

  const timerRatio = question && secondsLeft != null ? secondsLeft / question.timeLimitSec : 1;
  const timerState = secondsLeft <= 5 ? "danger" : timerRatio <= 0.4 ? "warn" : "normal";
  const timerFillClass = [styles.timerFill, timerState === "danger" ? styles.timerFillDanger : timerState === "warn" ? styles.timerFillWarn : ""].join(" ");
  const timerCountClass = [styles.timerCount, timerState === "danger" ? styles.timerCountDanger : timerState === "warn" ? styles.timerCountWarn : ""].join(" ");

  if (kicked) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Removed from room</h1>
          <p className={styles.waitingText} style={{ marginBottom: 20 }}>The host removed you from this game.</p>
          <button onClick={goBackToMultiplayer} className={styles.buttonSecondary}>Back to multiplayer</button>
        </div>
      </div>
    );
  }

  if (roomClosed) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Room closed</h1>
          <p className={styles.waitingText} style={{ marginBottom: 20 }}>The host has left and this game has ended.</p>
          <button onClick={goBackToMultiplayer} className={styles.buttonSecondary}>Back to multiplayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {hostDisconnected && (
          <p className={styles.error} style={{ marginBottom: 16 }}>
            Host connection lost, waiting for them to reconnect...
          </p>
        )}

        {question && (
          <div>
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
            <div className={styles.options}>
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={submitted}
                  className={`${styles.optionBtn} ${selected === i ? styles.optionSelected : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {submitted && <p className={styles.waitingText} style={{ marginTop: 16 }}>Answer submitted, waiting for others...</p>}
          </div>
        )}

        {questionResult && (
          <div>
            <p className={`${styles.resultBanner} ${selected === questionResult.correctIndex ? styles.correctText : styles.incorrectText}`}>
              {selected === questionResult.correctIndex ? "✅ Correct!" : "❌ Not quite"}
            </p>
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
            <p className={styles.waitingText} style={{ marginTop: 16 }}>Waiting for the host to continue...</p>
          </div>
        )}

        {finalLeaderboard && (
          <div>
            {finishReason === "ended-early" && (
              <p className={styles.waitingText} style={{ marginBottom: 12 }}>The host ended the quiz early.</p>
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

        {!question && !questionResult && !finalLeaderboard && (
          <p className={styles.waitingText}>Waiting for the host to start the quiz...</p>
        )}
      </div>
    </div>
  );
}

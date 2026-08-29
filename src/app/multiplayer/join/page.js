"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/lib/authContext";
import styles from "../multiplayer.module.css";

export default function JoinRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [playerName, setPlayerName] = useState(user?.name || "");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  // joins the room on the socket server, then redirects to the play screen
  function handleJoin(e) {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    setJoining(true);
    setError("");

    const socket = getSocket();
    const code = roomCode.trim().toUpperCase();

    socket.emit("player:join-room", { roomCode: code, playerName: playerName.trim(), userId: user?.id }, (res) => {
      setJoining(false);
      if (!res.ok) {
        setError(res.error || "Could not join room. Check your room code.");
        return;
      }
      sessionStorage.setItem(`mp_player_${code}`, res.playerId);
      sessionStorage.setItem(`mp_name_${code}`, playerName.trim());
      router.push(`/multiplayer/play/${code}`);
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/multiplayer" className={styles.backLink}>← Back</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🎓</span>
          <h1 className={styles.title} style={{ margin: 0 }}>IntelliQuiz Live</h1>
        </div>
        <p className={styles.subtitle}>Enter your nickname and the room code to join the game!</p>

        <form onSubmit={handleJoin} className={styles.form}>
          <div>
            <label className={styles.sectionLabel} style={{ display: 'block', marginBottom: '6px' }}>Your Nickname</label>
            <input
              className={styles.input}
              placeholder="e.g. Alex, Sam, Champion"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={styles.sectionLabel} style={{ display: 'block', marginBottom: '6px' }}>Room Code</label>
            <input
              className={styles.inputRoomCode}
              placeholder="6-LETTER CODE"
              maxLength={10}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <button type="submit" disabled={joining || !playerName.trim() || !roomCode.trim()} className={styles.button} style={{ marginTop: '8px' }}>
            {joining ? "Connecting to Game..." : "🚀 Enter Game Lobby"}
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

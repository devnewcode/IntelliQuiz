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

    socket.emit("player:join-room", { roomCode: code, playerName, userId: user?.id }, (res) => {
      setJoining(false);
      if (!res.ok) {
        setError(res.error || "Could not join room");
        return;
      }
      sessionStorage.setItem(`mp_player_${code}`, res.playerId);
      sessionStorage.setItem(`mp_name_${code}`, playerName);
      router.push(`/multiplayer/play/${code}`);
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/multiplayer" className={styles.backLink}>← Back</Link>
        <h1 className={styles.title}>Join a quiz</h1>
        <form onSubmit={handleJoin} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button type="submit" disabled={joining} className={styles.button}>
            {joining ? "Joining..." : "Join"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

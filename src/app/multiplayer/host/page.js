"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/lib/authContext";
import styles from "../multiplayer.module.css";

export default function HostLobbyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [hostName, setHostName] = useState(user?.name || "");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // asks the socket server to create a room, then redirects to it
  function handleCreateRoom(e) {
    e.preventDefault();
    if (!hostName.trim()) return;
    setCreating(true);
    setError("");

    const socket = getSocket();
    const payload = {
      hostName,
      maxPlayers: maxPlayers ? parseInt(maxPlayers, 10) : null,
    };

    socket.emit("host:create-room", payload, (res) => {
      setCreating(false);
      if (!res.ok) {
        setError(res.error || "Could not create room");
        return;
      }
      sessionStorage.setItem(`mp_host_${res.room.code}`, res.hostId);
      router.push(`/multiplayer/host/${res.room.code}`);
    });
  }

  const isAdmin = user && (user.role === "admin" || user.role === "superadmin");

  // hosting requires an admin account
  if (!loading && !isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Host a multiplayer quiz</h1>
          <p className={styles.waitingText} style={{ marginBottom: 20 }}>
            {user ? "Only admins can host a game." : "You need to be logged in as an admin to host a game."}
          </p>
          {!user && (
            <Link href="/" className={styles.button} style={{ textAlign: "center", display: "block", marginBottom: 12 }}>
              Log in
            </Link>
          )}
          <Link href="/multiplayer" className={styles.buttonSecondary}>
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/multiplayer" className={styles.backLink}>← Back</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🎓</span>
          <h1 className={styles.title} style={{ margin: 0 }}>IntelliQuiz Live</h1>
        </div>
        <p className={styles.subtitle}>Create a multiplayer room to host a live match.</p>
        <form onSubmit={handleCreateRoom} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Your name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
          <input
            className={styles.input}
            type="number"
            min="1"
            placeholder="Max players (optional, leave blank for unlimited)"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
          />
          <button type="submit" disabled={creating} className={styles.button}>
            {creating ? "Creating..." : "Create room"}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

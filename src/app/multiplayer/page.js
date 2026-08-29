import Link from "next/link";
import styles from "./multiplayer.module.css";

export default function MultiplayerLandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Multiplayer Quiz</h1>
        <div className={styles.form}>
          <Link href="/multiplayer/host" className={styles.button} style={{ textAlign: "center", display: "block" }}>
            Host a game
          </Link>
          <Link href="/multiplayer/join" className={styles.buttonSecondary}>
            Join a game
          </Link>
        </div>
      </div>
    </div>
  );
}

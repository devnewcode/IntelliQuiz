# IntelliQuiz

An AI-powered quiz platform built with Next.js, MongoDB, and the Gemini API. Admins generate quizzes with AI, students take them with live timers and instant AI-generated explanations for wrong answers, and guests can play public quizzes without creating an account.

**Live demo:** https://intelli-quiz-flax.vercel.app/

---

## Features

- **Role-based accounts** — student, admin, and superadmin roles with JWT authentication
- **AI quiz generation** — admins generate quizzes from a topic/prompt using the Gemini API, or can upload documents, with schema validation and automatic retry if the AI's output is malformed
- **Guest play mode** — anyone can play public quizzes without signing up, with optional passcode protection
- **Timed quizzes** — configurable time limits, auto-submit on expiry, question navigation
- **AI-generated explanations** — after submitting, wrong answers get a personalized explanation generated on the fly
- **Live multiplayer** — admins can host a quiz in real time over WebSockets: players join with a room code, everyone answers the same question on a synced countdown, and a live leaderboard updates after each round. Handles host/player disconnects and reconnects gracefully, and only the quiz owner (or a public quiz) can be hosted, with correct answers looked up server-side so a host can never rig scoring
- **Server-side grading** — quizzes are graded and scored entirely server-side; correct answers are never sent to the browser before submission, closing off score-tampering via DevTools
- **Results dashboard** — students see their history and stats; admins see results for quizzes they created
- **Automated tests + CI** — Jest test suite runs automatically on every Pull Request via GitHub Actions before merge

## Tech Stack

**Frontend:** Next.js (App Router), React, CSS Modules
**Backend:** Next.js API routes, Node.js
**Realtime:** Socket.io (standalone Node server)
**Database:** MongoDB with Mongoose
**Auth:** JWT, bcrypt
**AI:** Google Gemini API
**Validation:** Zod
**Testing:** Jest
**CI/CD:** GitHub Actions, Vercel

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/devnewcode/IntelliQuiz.git
cd IntelliQuiz
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy `.env.example` to a new file called `.env.local` and fill in your own values:
```bash
cp .env.example .env.local
```
See [Environment Variables](#environment-variables) below for what each one is and where to get it.

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string (e.g. from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) |
| `JWT_SECRET` | Any long random string, used to sign login tokens |
| `GEMINI_API_KEY` | Your Google Gemini API key, from [Google AI Studio](https://aistudio.google.com/) |
| `NEXT_PUBLIC_SOCKET_URL` | URL of the multiplayer socket server (e.g. `http://localhost:4000` locally) |

None of these are committed to the repo — `.env.local` is gitignored, so your keys stay private.

## Multiplayer

Live multiplayer runs as a **separate backend** to handle real-time gameplay. It lives in its own repo: **[intelliquiz-socket-server](https://github.com/devnewcode/intelliquiz-socket-server)**.

It shares this app's MongoDB database and JWT secret, so a login here is recognized there too.

**Quick start:**

```bash
git clone https://github.com/devnewcode/intelliquiz-socket-server
cd intelliquiz-socket-server
cp .env.example .env  # fill in MONGODB_URI and JWT_SECRET, matching this app's values
npm install
npm run dev
```

Full environment variable reference, project structure, and deployment notes are available in the socket server's own README. This app only needs `NEXT_PUBLIC_SOCKET_URL` pointed at wherever the socket server is running (see the env table above).

With both running, host a game from `/multiplayer/host` (admin/superadmin only) or join one from `/multiplayer/join`.


## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the local development server |
| `npm run build` | Builds the app for production (same build Vercel runs) |
| `npm run start` | Runs the production build locally |
| `npm test` | Runs the Jest test suite |
| `npm run lint` | Runs ESLint |

## Testing

```bash
npm test
```
Tests cover the quiz-grading logic (`src/lib/scoring.js`) and JWT token handling (`src/lib/auth.js`). Every Pull Request automatically runs this suite via GitHub Actions before it can be merged.

## Project Structure

Routes live under `src/app/` (`admin`, `student`, `play`, `results`, and `api/` for backend routes); shared logic (auth, database connection, quiz grading) lives in `src/lib/`.

## Security Notes

Quizzes are graded entirely server-side — correct answers and passcodes are never exposed to the client before submission, and client-reported scores are never trusted. The same applies to multiplayer: the socket server looks up each quiz's real questions and correct answers from MongoDB itself rather than trusting them from the hosting browser, and only a quiz's owner (or a public quiz) can be hosted live.

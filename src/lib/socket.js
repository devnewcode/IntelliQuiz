"use client";

import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socket;
let socketToken; // token the current connection authenticated with

// one shared connection reused across the app.... re-checks the login
// token on every call and reconnects if it changed.... so the socket server always knows who you actually are.
export function getSocket() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token } });
    socketToken = token;
    return socket;
  }

  if (token !== socketToken) {
    socket.auth = { token };
    socketToken = token;
    socket.disconnect().connect(); // forces the server to re-check auth
  }

  return socket;
}

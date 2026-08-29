"use client";

import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socket;
let socketToken;

// Singleton client connection; reconnects if auth token changes
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
    socket.disconnect().connect();
  }

  return socket;
}

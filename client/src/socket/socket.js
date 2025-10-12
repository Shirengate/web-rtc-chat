import { io } from "socket.io-client";

const host = import.meta.env.DEV
  ? import.meta.env.VITE_LOCALHOST
  : import.meta.env.VITE_API_URL;

export const socket = io(host, {
  transports: ["websocket", "polling", "flashsocket"],
  cors: {
    origin: host,
    credentials: true,
  },
  withCredentials: true,
});

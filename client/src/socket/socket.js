import { io } from "socket.io-client";

export const socket = io("http://localhost:8000", {
  transports: ["websocket", "polling", "flashsocket"],
  cors: {
    origin: "http://localhost:8000",
    credentials: true,
  },
  withCredentials: true,
});

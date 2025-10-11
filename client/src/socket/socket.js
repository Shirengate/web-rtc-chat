import { io } from "socket.io-client";

export const socket = io("https://ws-production-1f43.up.railway.app/", {
  transports: ["websocket", "polling", "flashsocket"],
  cors: {
    origin: "https://ws-production-1f43.up.railway.app/",
    credentials: true,
  },
  withCredentials: true,
});

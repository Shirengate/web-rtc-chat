import { io } from "socket.io-client";
import { host } from "../assets/config";

export const socket = io(host, {
  transports: ["websocket", "polling", "flashsocket"],
  cors: {
    origin: host,
    credentials: true,
  },
  withCredentials: true,
});

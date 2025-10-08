const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Хранилище для комнат и пользователей
const rooms = new Map(); // roomId -> { users: Set, createdAt, settings }
const users = new Map(); // socketId -> userData

// Функция для логирования
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Маршруты API
app.get("/api/rooms", (req, res) => {
  const roomsInfo = Array.from(rooms.entries()).map(([roomId, room]) => ({
    roomId,
    userCount: room.users.size,
    createdAt: room.createdAt,
    users: Array.from(room.users).map((socketId) => users.get(socketId)),
  }));
  res.json(roomsInfo);
});

app.get("/api/rooms/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const roomInfo = {
    roomId,
    userCount: room.users.size,
    createdAt: room.createdAt,
    users: Array.from(room.users).map((socketId) => users.get(socketId)),
  };

  res.json(roomInfo);
});

// Создание комнаты
app.post("/api/rooms/create", (req, res) => {
  const { roomId, settings = {} } = req.body;

  if (!roomId) {
    return res.status(400).json({ error: "Room ID is required" });
  }

  if (rooms.has(roomId)) {
    return res.status(409).json({ error: "Room already exists" });
  }

  const room = {
    users: new Set(),
    createdAt: new Date(),
    settings: {
      maxUsers: settings.maxUsers || 10,
      isPublic: settings.isPublic !== false,
      ...settings,
    },
  };

  rooms.set(roomId, room);
  log(`✅ Комната создана: ${roomId}`);

  res.json({
    roomId,
    createdAt: room.createdAt,
    settings: room.settings,
  });
});

// Socket.io обработчики
io.on("connection", (socket) => {
  log(`Новое подключение: ${socket.id}`);

  // Создание комнаты через сокет
  socket.on("create-room", (data) => {
    const { roomId, userId, userData, settings = {} } = data;

    if (!roomId || !userId) {
      socket.emit("error", { message: "Room ID and User ID are required" });
      return;
    }

    // Проверяем, существует ли комната
    if (rooms.has(roomId)) {
      socket.emit("error", { message: "Room already exists" });
      return;
    }

    // Создаем комнату
    const room = {
      users: new Set(),
      createdAt: new Date(),
      settings: {
        maxUsers: settings.maxUsers || 10,
        isPublic: settings.isPublic !== false,
        ...settings,
      },
    };

    rooms.set(roomId, room);
    log(`✅ Комната создана через сокет: ${roomId} пользователем ${userId}`);

    // Присоединяем создателя к комнате
    joinRoom(socket, roomId, userId, userData);
  });

  // Присоединение к существующей комнате
  socket.on("join-room", (data) => {
    const { roomId, userId, userData } = data;

    if (!roomId || !userId) {
      socket.emit("error", { message: "Room ID and User ID are required" });
      return;
    }

    // Проверяем существование комнаты
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    // Проверяем лимит пользователей
    if (room.users.size >= room.settings.maxUsers) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    joinRoom(socket, roomId, userId, userData);
  });

  // Выход из комнаты
  socket.on("leave-room", () => {
    if (socket.roomId) {
      leaveRoom(socket, socket.roomId);
    }
  });

  // WebRTC сигналы
  socket.on("offer", (data) => {
    const { targetUserId, offer } = data;

    if (!targetUserId || !offer) {
      socket.emit("error", {
        message: "Target user ID and offer are required",
      });
      return;
    }

    const targetUser = getUserByUserId(targetUserId);
    if (!targetUser) {
      socket.emit("error", { message: "Target user not found" });
      return;
    }

    log(`Отправка offer от ${socket.userId} к ${targetUserId}`);

    socket.to(targetUser.socketId).emit("offer", {
      offer,
      fromUserId: socket.userId,
    });
  });

  socket.on("answer", (data) => {
    const { targetUserId, answer } = data;

    if (!targetUserId || !answer) {
      socket.emit("error", {
        message: "Target user ID and answer are required",
      });
      return;
    }

    const targetUser = getUserByUserId(targetUserId);
    if (!targetUser) {
      socket.emit("error", { message: "Target user not found" });
      return;
    }

    log(`Отправка answer от ${socket.userId} к ${targetUserId}`);

    socket.to(targetUser.socketId).emit("answer", {
      answer,
      fromUserId: socket.userId,
    });
  });

  socket.on("ice-candidate", (data) => {
    const { targetUserId, candidate } = data;

    if (!targetUserId || !candidate) {
      socket.emit("error", {
        message: "Target user ID and candidate are required",
      });
      return;
    }

    const targetUser = getUserByUserId(targetUserId);
    if (!targetUser) {
      socket.emit("error", { message: "Target user not found" });
      return;
    }

    socket.to(targetUser.socketId).emit("ice-candidate", {
      candidate,
      fromUserId: socket.userId,
    });
  });

  // Сообщения чата
  socket.on("chat-message", (data) => {
    const { message, roomId } = data;

    if (!message || !socket.roomId) {
      return;
    }

    const chatMessage = {
      id: generateId(),
      userId: socket.userId,
      message,
      timestamp: new Date(),
      userData: users.get(socket.id)?.userData || {},
    };

    log(
      `Сообщение чата от ${socket.userId} в комнате ${socket.roomId}: ${message}`
    );

    io.to(socket.roomId).emit("chat-message", chatMessage);
  });

  // Пинг для проверки соединения
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date() });
  });

  // Отслеживание активности
  socket.on("user-activity", (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("user-activity", {
        userId: socket.userId,
        activity: data.activity,
        timestamp: new Date(),
      });
    }
  });

  // Обработка отключения
  socket.on("disconnect", (reason) => {
    log(
      `Пользователь отключился: ${socket.id} (${socket.userId}), причина: ${reason}`
    );

    if (socket.roomId) {
      leaveRoom(socket, socket.roomId);
    }

    // Удаляем пользователя из хранилища
    users.delete(socket.id);
  });

  // Обработка ошибок
  socket.on("error", (error) => {
    log(`Socket error от ${socket.userId}: ${error.message}`);
  });
});

// Вспомогательные функции

function joinRoom(socket, roomId, userId, userData) {
  const room = rooms.get(roomId);

  if (!room) {
    socket.emit("error", { message: "Room not found" });
    return;
  }

  // Проверяем, не находится ли пользователь уже в этой комнате
  if (socket.roomId === roomId && socket.userId === userId) {
    log(`Пользователь ${userId} уже в комнате ${roomId}`);
    socket.emit("room-joined", {
      roomId,
      usersInRoom: getUsersInRoom(roomId).filter((user) => user.id !== userId),
      yourId: userId,
      roomSettings: room.settings,
    });
    return;
  }

  // Выходим из предыдущей комнаты если это ДРУГАЯ комната
  if (socket.roomId && socket.roomId !== roomId) {
    leaveRoom(socket, socket.roomId);
  }

  // Добавляем пользователя в комнату
  room.users.add(socket.id);

  // Сохраняем информацию о пользователе
  users.set(socket.id, {
    id: userId,
    socketId: socket.id,
    roomId: roomId,
    userData: userData || {},
    joinedAt: new Date(),
  });

  socket.join(roomId);
  socket.roomId = roomId;
  socket.userId = userId;

  // Получаем список пользователей в комнате
  const usersInRoom = getUsersInRoom(roomId);

  // Уведомляем других участников о новом пользователе
  socket.to(roomId).emit("user-joined", {
    userId,
    userData: userData || {},
    usersInRoom: usersInRoom.filter((user) => user.id !== userId),
  });

  // Отправляем текущее состояние комнаты новому пользователю
  socket.emit("room-joined", {
    roomId,
    usersInRoom: usersInRoom.filter((user) => user.id !== userId),
    yourId: userId,
    roomSettings: room.settings,
  });

  log(
    `Пользователь ${userId} успешно присоединился к комнате ${roomId}. Всего пользователей: ${room.users.size}`
  );
}

function leaveRoom(socket, roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.users.delete(socket.id);

    // Уведомляем других участников об отключении
    socket.to(roomId).emit("user-left", {
      userId: socket.userId,
      reason: "left",
    });

    log(`Пользователь ${socket.userId} покинул комнату ${roomId}`);

    // Очищаем данные сокета
    socket.leave(roomId);
    delete socket.roomId;
    delete socket.userId;
  }
}

function getUsersInRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];

  return Array.from(room.users)
    .map((socketId) => users.get(socketId))
    .filter((user) => user !== undefined);
}

function getUserByUserId(userId) {
  for (let [socketId, user] of users) {
    if (user.id === userId) {
      return user;
    }
  }
  return null;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Очистка пустых комнат каждые 5 минут
setInterval(() => {
  const now = new Date();
  let cleanedCount = 0;

  for (let [roomId, room] of rooms) {
    if (room.users.size === 0) {
      // Удаляем комнаты, которые пусты более 30 минут
      const timeDiff = now - room.createdAt;
      if (timeDiff > 30 * 60 * 1000) {
        rooms.delete(roomId);
        cleanedCount++;
        log(`🧹 Удалена пустая комната: ${roomId}`);
      }
    }
  }

  if (cleanedCount > 0) {
    log(`🧹 Всего удалено пустых комнат: ${cleanedCount}`);
  }
}, 5 * 60 * 1000); // 5 минут

// Запуск сервера
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  log(`🚀 Сервер сигнализации запущен на порту ${PORT}`);
  log(`📊 Статус: http://localhost:${PORT}/api/rooms`);
});

// Обработка graceful shutdown
process.on("SIGINT", () => {
  log("🛑 Остановка сервера...");
  server.close(() => {
    log("✅ Сервер остановлен");
    process.exit(0);
  });
});

<template>
  <div class="wrapper">
    <video
      class="video"
      autoplay
      playsinline
      ref="my_video_ref"
      muted
      id="my-video"
    ></video>
    <video
      class="video"
      autoplay
      playsinline
      ref="remote_video_ref"
      id="remote-video"
    ></video>

    <button :disabled="disabled" @click="callFn" class="join-room__btn">
      Join room
    </button>

    <div class="status">{{ connectionStatus }}</div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { socket } from "../socket/socket";
import randomName from "@scaleway/random-name";

//// variables
const my_video_ref = ref(null);
const remote_video_ref = ref(null);
const disabled = ref(false);
const connectionStatus = ref("Не подключено");
const localMedieStream = ref(null);

// Хранилище для peer connections (для каждого пользователя отдельное)
const peerConnections = new Map();
const pendingCandidates = new Map();

/// functions
const callFn = async () => {
  if (!localMedieStream.value) {
    alert("Включите камеру");
    return null;
  }
  socket.emit("join", {
    room: "room_123",
    name: randomName(),
  });
  disabled.value = true;
  connectionStatus.value = "Подключение...";
};

// Создание нового peer connection для конкретного пользователя
const createPeerConnection = (userId) => {
  console.log(`🔧 Создание PC для пользователя: ${userId}`);

  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      // TURN серверы для работы через NAT
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
    iceCandidatePoolSize: 10,
  });

  // Обработчик ICE кандидатов
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("candidate", {
        target: userId,
        candidate: e.candidate,
      });
      console.log(
        `📤 Отправлен ICE candidate для ${userId}:`,
        e.candidate.type
      );
    } else {
      console.log(`❄️ ICE gathering завершён для ${userId}`);
    }
  };

  // Отслеживание состояния ICE
  pc.oniceconnectionstatechange = () => {
    console.log(
      `🔌 ICE connection state для ${userId}:`,
      pc.iceConnectionState
    );
    connectionStatus.value = `ICE: ${pc.iceConnectionState}`;

    if (
      pc.iceConnectionState === "connected" ||
      pc.iceConnectionState === "completed"
    ) {
      connectionStatus.value = "✅ Подключено";
    } else if (pc.iceConnectionState === "failed") {
      connectionStatus.value = "❌ Ошибка подключения";
      console.error(`ICE connection failed для ${userId}`);
    } else if (pc.iceConnectionState === "disconnected") {
      connectionStatus.value = "⚠️ Отключено";
    }
  };

  // Отслеживание общего состояния соединения
  pc.onconnectionstatechange = () => {
    console.log(`🔗 Connection state для ${userId}:`, pc.connectionState);
  };

  // Получение удалённого видео потока
  pc.addEventListener("track", (e) => {
    console.log(`📹 Получен remote track от ${userId}`);
    const mediaStream = e.streams[0];
    if (remote_video_ref.value) {
      remote_video_ref.value.srcObject = mediaStream;
    }
  });

  // Сохраняем peer connection и инициализируем буфер для кандидатов
  peerConnections.set(userId, pc);
  pendingCandidates.set(userId, []);

  return pc;
};

/// Socket handlers

socket.on("user_joined", async (user) => {
  console.log("✅ Новый пользователь присоединился:", user);
  const userId = user.user.id;

  try {
    // Создаём новое peer connection для этого пользователя
    const pc = createPeerConnection(userId);

    // Добавляем локальные треки
    localMedieStream.value.getTracks().forEach((track) => {
      pc.addTrack(track, localMedieStream.value);
      console.log(`➕ Добавлен track: ${track.kind}`);
    });

    // Создаём offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Отправляем offer
    socket.emit("offer", {
      target: userId,
      sdp: offer,
    });
    console.log(`📨 Отправлен offer для ${userId}`);
  } catch (error) {
    console.error("❌ Ошибка в user_joined:", error);
  }
});

socket.on("getOffer", async (sdp) => {
  if (!sdp.sdp || !sdp.sender) {
    console.error("❌ Некорректный offer");
    return;
  }

  console.log(`📨 Получен offer от ${sdp.sender}`);
  const userId = sdp.sender;

  try {
    // Создаём новое peer connection для этого пользователя
    const pc = createPeerConnection(userId);

    // Добавляем локальные треки
    localMedieStream.value.getTracks().forEach((track) => {
      pc.addTrack(track, localMedieStream.value);
    });

    // Устанавливаем remote description
    await pc.setRemoteDescription(new RTCSessionDescription(sdp.sdp));
    console.log(`✅ setRemoteDescription выполнен для ${userId}`);

    // Применяем все накопленные candidates
    const pending = pendingCandidates.get(userId) || [];
    console.log(
      `📦 Применение ${pending.length} накопленных candidates для ${userId}`
    );
    for (const candidate of pending) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidates.set(userId, []);

    // Создаём answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Отправляем answer
    socket.emit("answer", {
      target: userId,
      sdp: answer,
    });
    console.log(`📨 Отправлен answer для ${userId}`);
  } catch (error) {
    console.error("❌ Ошибка в getOffer:", error);
  }
});

socket.on("getAnswer", async (sdp) => {
  if (!sdp.sdp || !sdp.sender) {
    console.error("❌ Некорректный answer");
    return;
  }

  console.log(`📨 Получен answer от ${sdp.sender}`);
  const userId = sdp.sender;

  try {
    const pc = peerConnections.get(userId);
    if (!pc) {
      console.error(`❌ Peer connection не найден для ${userId}`);
      return;
    }

    // Устанавливаем remote description
    await pc.setRemoteDescription(new RTCSessionDescription(sdp.sdp));
    console.log(`✅ setRemoteDescription выполнен для ${userId}`);

    // Применяем все накопленные candidates
    const pending = pendingCandidates.get(userId) || [];
    console.log(
      `📦 Применение ${pending.length} накопленных candidates для ${userId}`
    );
    for (const candidate of pending) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidates.set(userId, []);
  } catch (error) {
    console.error("❌ Ошибка в getAnswer:", error);
  }
});

socket.on("getCandidate", async ({ candidate, sender }) => {
  if (!sender || !candidate) {
    console.error("❌ Некорректный candidate");
    return;
  }

  console.log(`📥 Получен candidate от ${sender}`);

  try {
    const pc = peerConnections.get(sender);

    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      // Remote description уже установлен - добавляем candidate сразу
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`✅ Candidate добавлен для ${sender}`);
    } else {
      // Remote description ещё не установлен - добавляем в буфер
      const pending = pendingCandidates.get(sender) || [];
      pending.push(candidate);
      pendingCandidates.set(sender, pending);
      console.log(
        `⏳ Candidate добавлен в буфер для ${sender}. Всего в буфере: ${pending.length}`
      );
    }
  } catch (error) {
    console.error(`❌ Ошибка при добавлении candidate для ${sender}:`, error);
  }
});

socket.on("user_left", (data) => {
  const userId = data?.user?.id;
  if (userId) {
    console.log(`👋 Пользователь покинул комнату: ${userId}`);

    // Закрываем peer connection
    const pc = peerConnections.get(userId);
    if (pc) {
      pc.close();
      peerConnections.delete(userId);
    }

    // Очищаем буфер кандидатов
    pendingCandidates.delete(userId);
  }
});

/// Lifecycle hooks
onMounted(async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    if (my_video_ref.value) {
      my_video_ref.value.srcObject = mediaStream;
      localMedieStream.value = mediaStream;
    }

    console.log("📹 Локальный медиа поток получен");
  } catch (error) {
    console.error("❌ Ошибка получения медиа потока:", error);
    alert("Не удалось получить доступ к камере/микрофону");
  }
});

onUnmounted(() => {
  // Закрываем все peer connections при размонтировании
  peerConnections.forEach((pc) => pc.close());
  peerConnections.clear();
  pendingCandidates.clear();

  // Останавливаем локальный медиа поток
  if (localMedieStream.value) {
    localMedieStream.value.getTracks().forEach((track) => track.stop());
  }
});
</script>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
}

.video {
  border: 2px solid #007bff;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  height: 450px;
  background-color: #000;
  object-fit: cover;
}

.join-room__btn {
  background: none;
  border: none;
  font-size: 30px;
  border: 1px solid gray;
  min-width: 500px;
  background: lightgray;
  border-radius: 10px;
  cursor: pointer;
  padding: 10px;
}

.join-room__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status {
  font-size: 18px;
  font-weight: bold;
  padding: 10px 20px;
  background: #f0f0f0;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .video {
    height: 300px;
    max-width: 100%;
  }

  .wrapper {
    gap: 10px;
    padding: 10px;
  }

  .join-room__btn {
    min-width: 300px;
    font-size: 20px;
  }
}
</style>
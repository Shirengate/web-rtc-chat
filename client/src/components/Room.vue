<template>
  <div class="room-container">
    <div class="room-header">
      <div class="room-info">
        <h2 class="room-title">Комната #{{ params.id }}</h2>
        <div class="room-status">
          <span class="status-dot"></span>
          <span class="status-text">Онлайн: {{ totalUsers }}</span>
        </div>
      </div>
      <div class="room-actions">
        <button class="btn btn-secondary" @click="leaveRoom">
          Покинуть комнату
        </button>
      </div>
    </div>

    <div class="room-content">
      <div class="main-square">
        <div class="video-grid">
          <!-- Локальное видео -->
          <div class="video-wrapper local-video">
            <video
              ref="localVideoRef"
              autoplay
              playsinline
              muted
              class="video-element"
            ></video>
            <div class="video-label">Вы</div>
          </div>

          <!-- Удаленные видео -->
          <div
            v-for="(stream, userId) in peerMeida"
            :key="userId"
            class="video-wrapper remote-video"
          >
            <video
              :ref="(el) => setRemoteVideoRef(el, userId)"
              autoplay
              playsinline
              class="video-element"
            ></video>
            <div class="video-label">{{ getUserName(userId) }}</div>
          </div>

          <!-- Заглушка если нет видео -->
          <div v-if="Object.keys(peerMeida).length === 0" class="no-videos">
            <p>Ожидание подключения других участников...</p>
          </div>
        </div>
      </div>
    </div>

    <div class="room-sidebar">
      <div class="users-list">
        <h3 class="sidebar-title">Участники ({{ totalUsers }})</h3>
        <div class="user-item you">
          <div class="user-avatar"></div>
          <span class="username">Вы</span>
          <span class="video-indicator">🎥</span>
        </div>
        <div class="user-item" v-for="user in users" :key="user.id">
          <div class="user-avatar"></div>
          <span class="username">{{ user.userData?.name || user.id }}</span>
          <span v-if="peerMeida[user.id]" class="video-indicator">🎥</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { socket } from "../socket/socket";
import {
  onMounted,
  watchEffect,
  ref,
  onUnmounted,
  reactive,
  computed,
  nextTick,
} from "vue";

const { params } = useRoute();
const router = useRouter();

const localVideoRef = ref(null);
const remoteVideoRefs = reactive({});
const users = ref([]);
const myMedia = ref(null);
const peerMeida = reactive({});
const peerConntections = reactive({});
const currentUserId = ref(null);

// Вычисляемые свойства
const totalUsers = computed(() => users.value.length + 1);

// Установка ссылки на удаленное видео
const setRemoteVideoRef = (el, userId) => {
  if (el) {
    remoteVideoRefs[userId] = el;
    // Если поток уже есть, устанавливаем его
    if (peerMeida[userId]) {
      el.srcObject = peerMeida[userId];
    }
  }
};

// Получение имени пользователя по ID
const getUserName = (userId) => {
  const user = users.value.find((u) => u.id === userId);
  return user?.userData?.name || `Участник ${userId.slice(-4)}`;
};

async function handlePeer({ id, createOffer }) {
  if (peerConntections[id]) {
    console.log(`P2P соединение с ${id} уже существует`);
    return;
  }

  console.log(
    `Создаем P2P соединение с пользователем: ${id}, createOffer: ${createOffer}`
  );

  peerConntections[id] = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });

  // Добавляем локальные треки
  if (myMedia.value) {
    myMedia.value.getTracks().forEach((track) => {
      peerConntections[id].addTrack(track, myMedia.value);
    });
  }

  // Обработка ICE кандидатов
  peerConntections[id].onicecandidate = (event) => {
    if (event.candidate) {
      console.log(`🧊 Отправляем ICE candidate пользователю ${id}`);
      socket.emit("ice-candidate", {
        targetUserId: id,
        candidate: event.candidate,
      });
    }
  };

  // Обработка входящих потоков - КЛЮЧЕВАЯ ЧАСТЬ!
  peerConntections[id].ontrack = (event) => {
    console.log("🎥 Получен удаленный поток от:", id, event.streams[0]);
    // Сохраняем поток
    peerMeida[id] = event.streams[0];
    setTimeout(() => {
      if (remoteVideoRefs[id]) {
        remoteVideoRefs[id].srcObject = remoteStream;
        console.log(`✅ Видео установлено с задержкой для ${id}`);
      }
    }, 1000);
  };

  // Создаем оффер если мы инициаторы
  if (createOffer) {
    try {
      const offer = await peerConntections[id].createOffer();
      await peerConntections[id].setLocalDescription(offer);

      console.log(`📤 Отправляем offer пользователю ${id}`);
      socket.emit("offer", {
        targetUserId: id,
        offer: offer,
      });
    } catch (error) {
      console.error("❌ Ошибка создания оффера:", error);
    }
  }
}

// Обработка входящего offer
socket.on("offer", async (data) => {
  console.log("📩 Получен offer от:", data.fromUserId);

  const { fromUserId, offer } = data;

  await handlePeer({
    id: fromUserId,
    createOffer: false,
  });

  try {
    await peerConntections[fromUserId].setRemoteDescription(offer);
    console.log("✅ Установлено удаленное описание от", fromUserId);

    const answer = await peerConntections[fromUserId].createAnswer();
    await peerConntections[fromUserId].setLocalDescription(answer);

    socket.emit("answer", {
      targetUserId: fromUserId,
      answer: answer,
    });
    console.log("📤 Отправлен answer пользователю", fromUserId);
  } catch (error) {
    console.error("❌ Ошибка обработки offer:", error);
  }
});

// Обработка входящего answer
socket.on("answer", async (data) => {
  console.log("📩 Получен answer от:", data.fromUserId);

  const { fromUserId, answer } = data;

  if (peerConntections[fromUserId]) {
    try {
      await peerConntections[fromUserId].setRemoteDescription(answer);
      console.log("✅ Установлен answer от", fromUserId);
    } catch (error) {
      console.error("❌ Ошибка установки answer:", error);
    }
  }
});

// Обработка входящих ICE кандидатов
socket.on("ice-candidate", async (data) => {
  console.log("🧊 Получен ICE candidate от:", data.fromUserId);

  const { fromUserId, candidate } = data;

  if (peerConntections[fromUserId]) {
    try {
      await peerConntections[fromUserId].addIceCandidate(candidate);
      console.log("✅ Добавлен ICE candidate от", fromUserId);
    } catch (error) {
      console.error("❌ Ошибка добавления ICE candidate:", error);
    }
  }
});

socket.on("user-left", (data) => {
  console.log("👋 Пользователь вышел:", data);
  users.value = users.value.filter((user) => user.id !== data.userId);

  // Удаляем соединение и видео
  if (peerConntections[data.userId]) {
    peerConntections[data.userId].close();
    delete peerConntections[data.userId];
  }
  if (peerMeida[data.userId]) {
    delete peerMeida[data.userId];
  }
});

socket.on("room-joined", (data) => {
  console.log("✅ Присоединились к комнате:", data);
  currentUserId.value = data.yourId;

  data.usersInRoom.forEach((user) => {
    handlePeer({
      id: user.id,
      createOffer: true,
    });
  });
});

socket.on("user-joined", (data) => {
  users.value = data.usersInRoom || [];
  console.log("👋 Новый пользователь:", data);

  if (data.userId) {
    handlePeer({
      id: data.userId,
      createOffer: true,
    });
  }
});

// Выход из комнаты
const leaveRoom = () => {
  Object.values(peerConntections).forEach((pc) => pc.close());
  if (myMedia.value) {
    myMedia.value.getTracks().forEach((track) => track.stop());
  }
  socket.emit("leave-room");
  router.push("/");
};

onMounted(async () => {
  try {
    myMedia.value = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    console.log("grwe", myMedia.value);
    if (localVideoRef.value) {
      localVideoRef.value.srcObject = myMedia.value;
    }

    console.log("✅ Локальный медиапоток получен");
  } catch (error) {
    console.error("❌ Ошибка получения медиапотока:", error);
  }
});

onUnmounted(() => {
  leaveRoom();
});

// Отслеживаем изменения в удаленных потоках
watchEffect(() => {
  console.log("📹 Активные удаленные потоки:", Object.keys(peerMeida));
});
</script>

<style lang="scss" scoped>
.room-container {
  display: grid;
  grid-template-areas:
    "header header"
    "content sidebar";
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr 300px;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  gap: 20px;
}

.room-header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.room-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.room-title {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.room-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  color: #666;
  font-size: 14px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.room-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
}

.btn-secondary {
  background: #ff4757;
  color: white;

  &:hover {
    background: #ff3742;
  }
}

.room-content {
  grid-area: content;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
}

.main-square {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-items: center;
}

.video-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  &.local-video {
    border: 3px solid #4caf50;
  }

  &.remote-video {
    border: 3px solid #667eea;
  }
}

.video-element {
  width: 300px;
  height: 200px;
  object-fit: cover;
  background: #000;
  display: block;
}

.video-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  font-size: 12px;
  text-align: center;
}

.no-videos {
  color: white;
  text-align: center;

  p {
    margin: 0;
    font-size: 18px;
    opacity: 0.8;
  }
}

.room-sidebar {
  grid-area: sidebar;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
}

.sidebar-title {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.3s ease;

  &.you {
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  &:not(.you) {
    background: rgba(102, 126, 234, 0.1);

    &:hover {
      background: rgba(102, 126, 234, 0.2);
    }
  }
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
}

.username {
  color: #333;
  font-weight: 500;
  flex: 1;
}

.video-indicator {
  font-size: 16px;
}
</style>
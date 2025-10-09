<template>
  <div class="room-container">
    <div class="room-header">
      <div class="room-info">
        <h2 class="room-title">Комната #{{ params.id }}</h2>
        <div class="room-status">
          <span class="status-dot"></span>
          <span class="status-text">Онлайн</span>
        </div>
      </div>
      <div class="room-actions">
        <button class="btn btn-secondary">Покинуть комнату</button>
      </div>
    </div>

    <div class="room-content">
      <div class="main-square">
        <div class="square-content">
          <video
            ref="videoRef"
            :src="myMedia"
            :autoplay="true"
            :playsinline="true"
          ></video>
        </div>
      </div>
    </div>

    <div class="room-sidebar">
      <div class="users-list">
        <h3 class="sidebar-title">Участники</h3>
        <div class="user-item">
          <div class="user-avatar"></div>
          <span class="username">Вы</span>
        </div>
        <div class="user-item" v-for="user in users" :key="user.id">
          <div class="user-avatar"></div>
          <span class="username">{{ user.userData.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useRoute } from "vue-router";
import { socket } from "../socket/socket";
import { onMounted, watchEffect, ref, onUnmounted, reactive } from "vue";
const { params } = useRoute();

const videoRef = ref(null);
const users = ref([]);
const myMedia = ref(null);
const peerMeida = reactive({});
const peerConntections = reactive({});
socket.on("user-left", (data) => {
  console.log("user-left", data);
  users.value = users.value.filter((user) => user.id !== data.userId);
});
socket.on("room-joined", (data) => {
  data.usersInRoom.forEach((user) => {
    handlePeer({
      id: user.id,
      createOffer: true,
    });
  });
  console.log("Присоединились к комнате:", data);
});

socket.on("user-joined", (data) => {
  users.value = data.usersInRoom || [];
  console.log("Новый пользователь:", data);
  if (data.userId) {
    handlePeer({
      id: data.userId,
      createOffer: true,
    });
  }
});

socket.on("ice-candidate", (data) => {
  console.log("Получен ICE candidate от:", data);
});

onMounted(async () => {
  myMedia.value = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  if (videoRef.value) {
    videoRef.value.srcObject = myMedia.value;
    videoRef.value.volume = 0;
  }
});

// Очистка при размонтировании
onUnmounted(() => {
  socket.emit("leave-room");
});

watchEffect(() => {
  console.log(users.value);
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
  width: 400px;
  height: 400px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }
}

.square-content {
  text-align: center;
  color: white;
}

.square-text {
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.2);
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
}
</style>
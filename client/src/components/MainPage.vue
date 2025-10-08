<template>
  <div class="main-container">
    <div class="content">
      <h1 class="title">Главная страница</h1>
      <div class="buttons-container">
        <button class="btn btn-primary" @click="createRoom">
          Создать комнату
        </button>
        <button class="btn btn-secondary" @click="joinRoom">
          Присоединиться к комнате
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { socket } from "../socket/socket";
import { useRouter } from "vue-router";
import { v4 } from "uuid";
const router = useRouter();
const createRoom = () => {
  const name = prompt("ВВедите имя");
  const roomId = v4();
  socket.emit("create-room", {
    roomId,
    userId: v4(),
    userData: {
      name,
      type: "participant",
    },
    settings: {
      maxUsers: 10,
      isPublic: true,
    },
  });
  router.push(`/room/${roomId}`);
};

const joinRoom = () => {
  const name = prompt("ВВедите имя");
  const roomId = prompt("ВВедите id комнаты");
  socket.emit("join-room", {
    roomId,
    userId: v4(),
    userData: {
      name,
      type: "participant",
    },
  });
  router.push(`/room/${roomId}`);
  console.log("Присоединение к комнате");
};
</script>

<style lang="scss" scoped>
.main-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}

.title {
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;

  &:hover {
    background: #667eea;
    color: white;
  }
}
</style>
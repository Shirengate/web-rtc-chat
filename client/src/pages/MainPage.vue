<template>
  <div class="wrapper">
    <div class="join-room__wrapper">
      <div class="video-container">
        <span>Проверьте аудио и видео</span>
        <video
          class="video"
          autoplay
          playsinline
          :srcObject="store.localMedia"
          ref="my_video_ref"
          muted
          id="my-video"
        ></video>
      </div>

      <div class="room-controls">
        <div class="room-controls__content">
          <h2 class="room-controls__title">Присоединиться к звонку</h2>

          <div class="form-group">
            <label for="create-room" class="form-label">Создать комнату</label>
            <InputText
              id="create-room"
              v-model="newRoomName"
              placeholder="Введите название комнаты"
              class="form-input"
            />
          </div>

          <div class="divider">
            <span class="divider-text">или</span>
          </div>

          <!-- Выбрать существующую комнату -->
          <div class="form-group">
            <label for="select-room" class="form-label">Выбрать комнату</label>
            <Select
              id="select-room"
              v-model="selectedRoom"
              :options="rooms"
              optionLabel="name"
              optionValue="id"
              placeholder="Выберите комнату"
              class="form-select"
            />
          </div>

          <!-- Кнопка присоединиться -->
          <Button
            label="Присоединиться"
            icon="pi pi-video"
            :disabled="disabled"
            @click="callFn"
            class="join-room__btn"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { useLocalMedia } from "../stores/local-media";
import { useRouter } from "vue-router";
const { setAudioMedia, setVideoMedia } = useLocalMedia();
import { socket } from "../socket/socket";
import randomName from "@scaleway/random-name";
const store = useLocalMedia();
const my_video_ref = ref(null);
const disabled = ref(false);
const router = useRouter();
// Данные формы
const newRoomName = ref("");
const selectedRoom = ref(null);
const rooms = ref([
  { id: "room_1", name: "Общая комната" },
  { id: "room_2", name: "Команда разработки" },
  { id: "room_3", name: "Встреча с клиентом" },
]);

const callFn = async () => {
  if (!store.localMedia) {
    alert("Включите камеру");
    return null;
  }
  socket.emit("join", {
    room: "room_123",
    name: randomName(),
  });
  router.push(`/room/room_123`);
  disabled.value = true;
};

watch(selectedRoom, (newVal) => {
  if (newVal) {
    newRoomName.value = "";
  }
});
watch(newRoomName, (newVal) => {
  if (newVal) {
    selectedRoom.value = null;
  }
});
onMounted(async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    mediaStream.getTracks().forEach((track) => {
      if (track.kind === "audio") {
        setAudioMedia(track);
      }
      if (track.kind === "video") {
        setVideoMedia(track);
      }
    });
  } catch (error) {
    return alert("Не удалось получить доступ к камере/микрофону");
  }
});

onUnmounted(() => {
  if (store.localMedia) {
    store.localMedia.getTracks().forEach((track) => track.stop());
  }
});
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.join-room__wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
}
.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  span {
    color: white;
    font-size: 18px;
    font-weight: 600;
  }
}
.video {
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  height: auto;
  aspect-ratio: 16/9;
  object-fit: cover;
  background-color: #000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.room-controls {
  flex: 1;
  max-width: 500px;
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.room-controls__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.room-controls__title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-align: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 4px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
  color: #a0aec0;
}

.divider {
  position: relative;
  text-align: center;
  margin: 8px 0;
}

.divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.divider-text {
  position: relative;
  display: inline-block;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #a0aec0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
}

.join-room__btn {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  color: black;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  margin-top: 8px;
}

/* Адаптив для планшетов */
@media (max-width: 1024px) {
  .join-room__wrapper {
    flex-direction: column;
    gap: 30px;
  }

  .video {
    max-width: 100%;
  }

  .room-controls {
    max-width: 100%;
    width: 100%;
  }
}

/* Адаптив для мобильных */
@media (max-width: 768px) {
  .wrapper {
    padding: 15px;
  }

  .room-controls {
    padding: 30px 20px;
  }

  .room-controls__title {
    font-size: 24px;
  }

  .video {
    border-radius: 15px;
  }

  .room-controls {
    border-radius: 15px;
  }
}

@media (max-width: 480px) {
  .wrapper {
    padding: 10px;
  }

  .room-controls {
    padding: 24px 16px;
  }

  .room-controls__title {
    font-size: 20px;
  }

  .form-input,
  .form-select {
    padding: 10px 14px;
    font-size: 14px;
  }

  .join-room__btn {
    padding: 12px 20px;
    font-size: 15px;
  }
}
</style>
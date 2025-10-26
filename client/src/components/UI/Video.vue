<template>
  <div class="video-container">
    <div class="video-wrapper">
      <video
        v-if="cameraEnabled"
        class="video"
        autoplay
        playsinline
        :srcObject="srcObject"
        :muted="me"
        id="my-video"
      ></video>
      <div v-else class="video-off">
        <div class="avatar">
          {{ me ? "Вы" : userName ? userName[0].toUpperCase() : "" }}
        </div>
      </div>
      <div class="user-info">
        <span class="user-info__name">{{ me ? "Вы" : userName }}</span>

        <i :class="['pi pi-microphone', microEnabled ? '' : 'off']"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  me: Boolean,
  srcObject: MediaStream,
  microEnabled: Boolean,
  cameraEnabled: Boolean,
  userName: {
    type: String,
  },
});
</script>

<style lang="scss" scoped>
.video-container {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  background-color: #2c2c2e;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.video,
.video-off {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-off {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #48484a;
  min-height: 250px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #6a6a6c;
  color: white;
  font-size: 48px;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 10px;
  color: white;

  span {
    font-size: 16px;
    font-weight: 500;
    max-width: 83px;
    overflow-x: scroll;
    white-space: nowrap;
    scrollbar-width: none;

  }

  i {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .video-wrapper {
    border-radius: 15px;
    min-height: 200px;
  }
  .avatar {
    width: 80px;
    height: 80px;
    font-size: 36px;
  }
  .user-info {
    bottom: 5px;
    left: 5px;
    padding: 4px 8px;
    span {
      font-size: 14px;
    }
    i {
      font-size: 14px;
    }
  }
}
.off {
  color: red;
}
</style>
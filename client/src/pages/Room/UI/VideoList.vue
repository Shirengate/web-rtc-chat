<template>
  <div v-for="media in remoteMediaStreams" :key="media.id" class="conf-wrapper">
    <Video
      :me="false"
      :srcObject="media.mediaStream"
      :microEnabled="media.microEnabled"
      :cameraEnabled="media.cameraEnabled"
      :userName="'name 1'"
    />
  </div>
</template>

<script setup>
defineProps({
  remoteMediaStreams: Array,
});
</script>

<style lang="scss" scoped>
.conf-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

@media (max-width: 480px) {
  .conf-wrapper {
    min-height: 150px;
  }
}

.conf-wrapper :deep(.video-wrapper) {
  max-width: 100%;

  border-radius: 8px;
}

.conf-wrapper :deep(.video-container) {
  align-items: normal;
}
</style>

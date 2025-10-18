<template>
  <div>
    <div
      v-for="media in remoteMediaStreams"
      :key="media.id"
      class="conf-wrapper"
    >
      <Video
        :me="false"
        :srcObject="media.mediaStream"
        :microEnabled="media.microEnabled"
        :cameraEnabled="media.cameraEnabled"
        :userName="'name 1'"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import Video from "@/components/UI/Video.vue";
const props = defineProps({
  remoteMediaStreams: Array,
});
</script>

<style scoped>
.conf-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .conf-wrapper {
    min-height: 180px;
    border-radius: 6px;
  }
}

/* Маленькие экраны */
@media (max-width: 480px) {
  .conf-wrapper {
    min-height: 150px;
  }
}
</style>

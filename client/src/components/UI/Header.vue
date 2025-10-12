<template>
  <Toolbar style="height: 100%">
    <template #start>
      <div class="options">
        <Button
          @click="enableVideo"
          :severity="store.isVideoEnabled ? 'contrast' : 'danger'"
          icon="pi pi-camera"
        />
        <Button
          @click="enableAudio"
          :severity="store.isAudioEnabled ? 'contrast' : 'danger'"
          icon="pi pi-microphone"
        />
      </div>
    </template>
    <template #end> <ToggleSwitch @click="switchTheme" /> </template>
  </Toolbar>
</template>

<script setup>
import Toolbar from "primevue/toolbar";
import ToggleSwitch from "primevue/toggleswitch";
import Button from "primevue/button";
import { useLocalMedia } from "../../stores/local-media";

const props = defineProps({
  videoRef: Object,
});

const store = useLocalMedia();

const enableVideo = async () => {
  const videoMedia = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  if (!videoMedia.active) {
    return;
  }
  store.setVideoMedia(videoMedia, props.videoRef);
};
const enableAudio = async () => {
  const videoMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  if (!videoMedia.active) {
    return;
  }
  store.setAudioMedia(videoMedia, props.videoRef);
};
</script>

<style  scoped>
.options {
  display: flex;
  gap: 10px;
}
</style>
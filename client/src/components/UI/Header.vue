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
  if (store.isVideoEnabled) {
    return store.setVideoMedia(null, props.videoRef);
  }
  const videoMedia = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  if (!videoMedia.active) {
    return;
  }
  videoMedia.getTracks().forEach((track) => {
    store.setVideoMedia(track);
  });
};
const enableAudio = async () => {
  if (store.isAudioEnabled) {
    return store.setAudioMedia(null, props.videoRef);
  }
  const audioMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  if (!audioMedia.active) {
    return;
  }

  audioMedia.getTracks().forEach((track) => {
    store.setAudioMedia(track);
  });
};
</script>

<style  scoped>
.options {
  display: flex;
  gap: 10px;
}
</style>
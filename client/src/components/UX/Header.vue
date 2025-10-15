<template>
  <Toolbar style="height: 100%; position: sticky; top: 5px; z-index: 10">
    <template #start>
      <div class="options">
        <Button
          @click="store.toggleVideo()"
          :severity="
            store.isVideoActive && store.isVideoEnabled ? 'contrast' : 'danger'
          "
          icon="pi pi-camera"
        />
        <Button
          @click="store.toggleAudio()"
          :severity="
            store.isAudioActive && store.isAudioEnabled ? 'contrast' : 'danger'
          "
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

const store = useLocalMedia();

const enableVideo = async () => {
  if (store.isVideoEnabled) {
    return store.setVideoMedia(null);
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
    return store.setAudioMedia(null);
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
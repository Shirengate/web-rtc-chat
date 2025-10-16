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
</script>

<style  scoped>
.options {
  display: flex;
  gap: 10px;
}
</style>
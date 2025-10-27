<template>
  <Toolbar style="height: 100%; position: sticky; top: 5px; z-index: 10">
    <template #start>
      <div class="options">
        <div class="camera">
          <Button @click="store.toggleVideo()" :severity="
            store.isVideoActive && store.isVideoEnabled ? 'contrast' : 'danger'
          " icon="pi pi-camera" />
          <i @click="toggle" class="pi pi-chevron-down arrow-icon"></i>
        </div>
        <Popover ref="op">
          <Select 
          @change="changeValue"
            v-model="selectedCamera"
            :options="store.allowedDevices" 
            optionLabel="label"
            optionValue="deviceId"
            placeholder="Выберите камеру"
            class="devices-select"
          >
            <template #option="slotProps">
              <div :class="['device-item', currentVideo.deviceId === slotProps.option.deviceId ? 'active' : '']">
                {{ slotProps.option.label }}
              </div>
            </template>
          </Select>
        </Popover>
        <Button @click="store.toggleAudio()" :severity="
            store.isAudioActive && store.isAudioEnabled ? 'contrast' : 'danger'
          " icon="pi pi-microphone" />
      </div>
    </template>
    <template #end>
      <ToggleSwitch @click="switchTheme" />
    </template>
  </Toolbar>
</template>

<script setup>
import Toolbar from "primevue/toolbar";
import ToggleSwitch from "primevue/toggleswitch";
import Button from "primevue/button";
import Popover from 'primevue/popover';
import Select from "primevue/select";
import { useLocalMedia } from "../../stores/local-media";
import { computed, onMounted, ref } from "vue";

const store = useLocalMedia();
const op = ref();
const selectedCamera = ref('');

const toggle = (event) => {
    op.value.toggle(event);
}

const currentVideo = computed(() => {
  return store.localVideo.getSettings()
})


const changeValue = async (event) => {
  try {
      const mediaStreams = await navigator.mediaDevices.getUserMedia({
    audio:false,
    video:{
      deviceId:{
        exact:selectedCamera.value
      }
    }
      })
      const videoTrack = mediaStreams.getVideoTracks()[0]
      
      store.setVideoMedia(videoTrack)
      
  } catch (error) {
    console.error('Cannot take this videostreams reason:', error)
    return
  }
  
}
onMounted(async () => {
  const devices =  (await navigator.mediaDevices.enumerateDevices()).filter(item => item.kind === 'videoinput')
  store.allowedDevices = devices
})  
</script>

<style scoped lang="scss">
.options {
  display: flex;
  gap: 12px;
  align-items: center;
}

.camera {
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  
  .arrow-icon {
    color: #6b7280;
    padding: 8px 12px;
    border-left: 1px solid #e5e7eb;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      background-color: #f3f4f6;
      color: #374151;
    }
  }
}

.devices-select {
  min-width: 200px;
}

.device-item {
  padding: 8px 16px;
  font-size: 14px;
  color: #374151;
  background: white; 
  cursor: pointer;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  &.active {
    background-color: #eff6ff;
    color: #2563eb;
  }
}
</style>
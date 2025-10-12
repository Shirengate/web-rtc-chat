import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

export const useLocalMedia = defineStore("localMedia", () => {
  const localMedia = ref(null);
  const localVideo = ref(null);
  const localAudio = ref(null);

  const isVideoEnabled = computed(() => {
    return localVideo.value !== null;
  });

  const isAudioEnabled = computed(() => {
    return localAudio.value !== null;
  });

  const setVideoMedia = (track) => {
    localVideo.value = track;
    if (!localMedia.value) {
      localMedia.value = new MediaStream();
    }
    localMedia.value.getVideoTracks().forEach((oldTrack) => {
      localMedia.value.removeTrack(oldTrack);
    });
    if (track) {
      localMedia.value.addTrack(track);
    }
  };

  const setAudioMedia = (track) => {
    localAudio.value = track;

    if (!localMedia.value) {
      localMedia.value = new MediaStream();
    }

    localMedia.value.getAudioTracks().forEach((oldTrack) => {
      localMedia.value.removeTrack(oldTrack);
    });

    if (track) {
      localMedia.value.addTrack(track);
    }
  };

  // Вотчер для видео

  return {
    isAudioEnabled,
    isVideoEnabled,
    localMedia,
    localVideo,
    localAudio,
    setAudioMedia,
    setVideoMedia,
  };
});

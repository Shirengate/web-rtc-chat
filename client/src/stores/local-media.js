import { defineStore } from "pinia";
import { ref, computed } from "vue";

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
    if (track === null) {
      const videoTrack = localMedia.value.getVideoTracks()[0];
      videoTrack.enabled = false;
      localVideo.value = null;
      return;
    }
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
    if (track === null) {
      const audioTrack = localMedia.value.getAudioTracks()[0];
      audioTrack.enabled = false;
      localAudio.value = null;
      return;
    }
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

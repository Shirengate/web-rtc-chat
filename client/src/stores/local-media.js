import { defineStore } from "pinia";
import { ref, computed, watchEffect, watch } from "vue";
export const useLocalMedia = defineStore("localMedia", () => {
  const localMedia = ref(null);
  const localVideo = ref(null);
  const localAudio = ref(null);

  const isVideoEnabled = computed(() => {
    if (!localVideo.value) return false;
    return localMedia.value.getVideoTracks().length > 0;
  });
  const isAudioEnabled = computed(() => {
    if (!localMedia.value) return false;
    return localMedia.value.getAudioTracks().length > 0;
  });

  const setVideoMedia = (media, ref) => {
    if (isVideoEnabled.value) {
      localVideo.value = null;
      ref.srcObject = null;
    } else {
      localVideo.value = media;
      ref.srcObject = media;
    }
  };

  const setAudioMedia = (media) => {
    if (isAudioEnabled.value) {
      localAudio.value = null;
      ref.srcObject = null;
    } else {
      localAudio.value = media;
      ref.srcObject = media;
    }
  };

  watch(
    [localAudio, localVideo],
    ([newAudio, newVideo], [oldAudio, oldVideo]) => {
      const tracks = [];
      console.log(localAudio, localVideo);
      if (newAudio && newAudio.kind === "audio") {
        tracks.push(newAudio);
      }

      if (newVideo && newVideo.kind === "video") {
        tracks.push(newVideo);
      }

      if (tracks.length > 0) {
        localMedia.value = new MediaStream(tracks);
      } else {
        localMedia.value = null;
      }
    },
    { deep: true }
  );
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

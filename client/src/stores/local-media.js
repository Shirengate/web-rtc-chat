import { socket } from "../socket/socket.js";

import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useLocalMedia = defineStore("localMedia", () => {
  const localMedia = ref(null);
  const localVideo = ref(null);
  const localAudio = ref(null);

  const isVideoActive = ref(true);
  const isAudioActive = ref(true);

  const isVideoEnabled = computed(() => !!localVideo.value);
  const isAudioEnabled = computed(() => !!localAudio.value);

  const toggleVideo = async () => {
    const videoTrack = localMedia.value?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      isVideoActive.value = videoTrack.enabled;
      socket.emit("toggle_video", {
        videoEnabled: videoTrack.enabled,
      });
    } else {
      const videoMedia = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (!videoMedia.active) {
        return;
      }
      videoMedia.getTracks().forEach((track) => {
        setVideoMedia(track);
      });
      socket.emit("toggle_video", {
        videoEnabled: true,
      });
    }
  };

  const toggleAudio = async () => {
    const audioTrack = localMedia.value?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      isAudioActive.value = audioTrack.enabled;
      socket.emit("toggle_audio", {
        audioEnabled: audioTrack.enabled,
      });
    } else {
      const audioMedia = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      if (!audioMedia.active) {
        return;
      }
      audioMedia.getTracks().forEach((track) => {
        setAudioMedia(track);
      });
      socket.emit("toggle_audio", {
        audioEnabled: true,
      });
    }
  };

  const setVideoMedia = (track) => {
    localVideo.value = track;
    if (!localMedia.value) {
      localMedia.value = new MediaStream();
    }
    localMedia.value.getVideoTracks().forEach((t) => {
      localMedia.value.removeTrack(t);
    });
    if (track) {
      localMedia.value.addTrack(track);
      isVideoActive.value = true;
    } else {
      isVideoActive.value = false;
    }
  };

  const setAudioMedia = (track) => {
    localAudio.value = track;
    if (!localMedia.value) {
      localMedia.value = new MediaStream();
    }
    localMedia.value.getAudioTracks().forEach((t) => {
      localMedia.value.removeTrack(t);
    });
    if (track) {
      localMedia.value.addTrack(track);
      isAudioActive.value = true;
    } else {
      isAudioActive.value = false;
    }
  };

  return {
    localMedia,
    localVideo,
    localAudio,
    isVideoEnabled,
    isAudioEnabled,
    isVideoActive,
    isAudioActive,
    setAudioMedia,
    setVideoMedia,
    toggleVideo,
    toggleAudio,
  };
});

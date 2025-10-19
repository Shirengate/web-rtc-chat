// hooks/useStreams.js
import { useLocalMedia } from "../stores/local-media";

export const useStreams = () => {
  const localMediaStore = useLocalMedia();

  const initMedia = async () => {
    if (localMediaStore.localMedia) {
      return localMediaStore.localMedia;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      if (localMediaStore.localMedia) {
        localMediaStore.localMedia.getTracks().forEach((track) => track.stop());
      }

      mediaStream.getTracks().forEach((track) => {
        if (track.kind === "audio") {
          localMediaStore.setAudioMedia(track);
        }
        if (track.kind === "video") {
          localMediaStore.setVideoMedia(track);
        }
      });
      return mediaStream;
    } catch (err) {
      alert(
        "Could not access camera and microphone. Please check permissions."
      );
      throw err;
    }
  };

  return {
    initMedia,
  };
};

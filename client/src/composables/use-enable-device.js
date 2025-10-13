import { useLocalMedia } from "../stores/local-media";

export const useEnableDevice = () => {
  const mediaStore = useLocalMedia();
  const enableDevice = async (device, peerConnections) => {
    let track;
    if (device === "audio" && mediaStore.isAudioEnabled) {
      track = mediaStore.localMedia.getAudioTracks()[0];
    } else if (device === "video" && mediaStore.isVideoEnabled) {
      track = mediaStore.localMedia.getVideoTracks()[0];
    }

    for (const [_, pc] of peerConnections) {
      const sender = pc.getSenders().find((s) => s.track?.kind === `${device}`);
      if (sender) {
        await sender.replaceTrack(track);
      }
    }
  };
  return { enableDevice };
};

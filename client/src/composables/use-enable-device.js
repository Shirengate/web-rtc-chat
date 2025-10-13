import { useLocalMedia } from "../stores/local-media";

export const useEnableDevice = () => {
  const enableDevice = (track) => {
    track.enabled = true;
  };
};

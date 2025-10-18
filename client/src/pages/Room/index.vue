<template>
  <div class="wrapper">
    <div class="conference-wrapper">
      <conference :participantCount="remoteMediaStreams.length + 1">
        <div class="conf-wrapper">
          <Video
            :me="true"
            :name="userStore.info.name"
            :cameraEnabled="store.isVideoActive"
            :microEnabled="store.isAudioActive"
            :srcObject="store.localMedia"
          />
        </div>
        <video-list :remoteMediaStreams="remoteMediaStreams" />
      </conference>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from "vue";
import { socket } from "@/socket/socket";
import Conference from "./UI/Conference.vue";
import { useLocalMedia } from "@/stores/local-media";
import { useUser } from "@/stores/user-info";
import Video from "@/components/UI/Video.vue";
import { createWebRtcManager } from "@/utils/web-rtc-manager";
import VideoList from "./UI/VideoList.vue";
//// variables
const store = useLocalMedia();
const remoteMediaStreams = ref([]);
const userStore = useUser();

const handleStreamAdded = (userId, track) => {
  let currentUser = remoteMediaStreams.value.find((m) => m.id === userId);
  if (!currentUser) {
    currentUser = {
      id: userId,
      mediaStream: new MediaStream(),
      microEnabled: true,
      cameraEnabled: true,
    };
    remoteMediaStreams.value.push(currentUser);
  }
  currentUser.mediaStream.addTrack(track);
};

const handleStreamRemoved = (userId) => {
  remoteMediaStreams.value = remoteMediaStreams.value.filter(
    (s) => s.id !== userId
  );
};
const {
  createPeerConnection,
  peerConnections,
  pendingCandidates,
  createAnswer,
  createOffer,
  getCandidate,
  getAnswer,
} = createWebRtcManager(handleStreamAdded);

/// Socket handlers
socket.on("user_joined", async (user) => {
  const userId = user.user.id;
  try {
    const pc = createPeerConnection(userId);

    store.localMedia.getTracks().forEach((track) => {
      pc.addTrack(track, store.localMedia);
    });

    createOffer(pc, userId);
  } catch (error) {
    return;
  }
});

socket.on("getOffer", async (sdp) => {
  if (!sdp.sdp || !sdp.sender) {
    return;
  }
  const userId = sdp.sender;
  try {
    const pc = createPeerConnection(userId);

    store.localMedia.getTracks().forEach((track) => {
      pc.addTrack(track, store.localMedia);
    });
    createAnswer(sdp, pc);
  } catch (error) {
    return;
  }
});

socket.on("getAnswer", async (sdp) => {
  if (!sdp.sdp || !sdp.sender) {
    return;
  }
  getAnswer(sdp);
});

socket.on("getCandidate", async ({ candidate, sender }) => {
  if (!sender || !candidate) {
    console.error("❌ Некорректный candidate");
    return;
  }

  getCandidate(candidate, sender);
});

socket.on("user_left", (data) => {
  const userId = data?.user?.id;
  if (userId) {
    const pc = peerConnections.get(userId);
    if (pc) {
      pc.close();
      peerConnections.delete(userId);
      remoteMediaStreams.value = remoteMediaStreams.value.filter(
        (m) => m.id !== userId
      );
    }
    pendingCandidates.delete(userId);
  }
});

socket.on("audio_state_changed", (data) => {
  if (!data) return;
  const currentUser = remoteMediaStreams.value.find(
    (user) => user.id === data.userId
  );
  if (!currentUser) {
    return;
  }
  currentUser.microEnabled = data.audioEnabled;
});
socket.on("video_state_changed", (data) => {
  if (!data) return;
  const currentUser = remoteMediaStreams.value.find(
    (user) => user.id === data.userId
  );
  if (!currentUser) {
    return;
  }
  currentUser.cameraEnabled = data.videoEnabled;
});
onUnmounted(() => {
  peerConnections.forEach((pc) => pc.close());
  peerConnections.clear();
  pendingCandidates.clear();
  remoteMediaStreams.value = [];
  if (store.localMedia) {
    store.localMedia.getTracks().forEach((track) => track.stop());
  }
});
</script>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  height: 100%;
  background: #1a1a1a;
}

.conference-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  border-radius: 12px;
  background: #2d2d2d;
}

.conf-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.participant-name {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.join-room__btn {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  min-width: 150px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.join-room__btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.5);
}

.join-room__btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

/* Мобильная версия */
@media (max-width: 768px) {
  .wrapper {
    padding: 10px;
  }

  .conference-wrapper {
    border-radius: 8px;
  }

  .conf-wrapper {
    min-height: 180px;
    border-radius: 6px;
  }

  .video-overlay {
    padding: 8px 12px;
  }

  .participant-name {
    font-size: 13px;
  }

  .join-room__btn {
    bottom: 20px;
    padding: 12px 24px;
    font-size: 15px;
    min-width: 130px;
  }
}

/* Маленькие экраны */
@media (max-width: 480px) {
  .wrapper {
    padding: 8px;
  }

  .conf-wrapper {
    min-height: 150px;
  }

  .join-room__btn {
    bottom: 15px;
    padding: 10px 20px;
    font-size: 14px;
    min-width: 110px;
  }
}

/* Ландшафтная ориентация на мобильных */

@media (max-width: 768px) and (orientation: landscape) {
  .conference-wrapper {
    max-height: calc(100vh - 100px);
  }
}
</style>

<style scoped>
.conf-wrapper :deep(.video-wrapper) {
  max-width: 100%;

  border-radius: 8px;
}

.conf-wrapper :deep(.video-container) {
  align-items: normal;
}
</style>



<template>
  <div>
    <ReconnectRoom v-if="openedAfter === 'close-tab' || !continueToRoom" />
    <div v-else class="wrapper">
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
  </div>
</template>

<script setup>
import { onUnmounted, ref, inject, onMounted } from "vue";
import { socket } from "@/socket/socket";
import Conference from "./UI/Conference.vue";
import { useLocalMedia } from "@/stores/local-media";
import { useUser } from "@/stores/user-info";
import Video from "@/components/UI/Video.vue";
import { createWebRtcManager } from "@/utils/web-rtc-manager";
import VideoList from "./UI/VideoList.vue";
import { useStreams } from "../../composables/use-streams";
import { useRoute } from "vue-router";
import ReconnectRoom from "./UI/ReconnectRoom.vue";
//// variables
const store = useLocalMedia();
const remoteMediaStreams = ref([]);
const userStore = useUser();
const route = useRoute();
const { initMedia } = useStreams();

const continueToRoom = ref(false);
const openedAfter = inject("openedAfter");

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

onMounted(async () => {
  if (!store.localMedia) {
    await initMedia();
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (openedAfter.value === "close-tab") {
    return;
  } else {
    continueToRoom.value = true;
    socket.emit("join", {
      room: route.params.id,
      name: userStore.name,
    });
  }
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
}

/* Маленькие экраны */
@media (max-width: 480px) {
  .wrapper {
    padding: 8px;
  }

  .conf-wrapper {
    min-height: 150px;
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
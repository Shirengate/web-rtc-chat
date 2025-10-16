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
        <div
          v-for="(media, index) in remoteMediaStreams"
          :key="media.id"
          class="conf-wrapper"
        >
          <Video
            :me="false"
            :srcObject="media.mediaStream"
            :microEnabled="media.microEnabled"
            :cameraEnabled="media.cameraEnabled"
            :userName="'name 1'"
          />
        </div>
      </conference>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from "vue";
import { socket } from "../socket/socket";
import Conference from "../components/UI/Conference.vue";
import { useLocalMedia } from "../stores/local-media";
import { useUser } from "../stores/user-info";
import Video from "../components/UI/Video.vue";
//// variables
const store = useLocalMedia();
const remoteMediaStreams = ref([]);
const peerConnections = new Map();
const pendingCandidates = new Map();
const userStore = useUser();
/// functions

const createPeerConnection = (userId) => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
    iceCandidatePoolSize: 10,
  });

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("candidate", {
        target: userId,
        candidate: e.candidate,
      });
    }
  };
  pc.addEventListener("track", (e) => {
    const track = e.track;
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
  });
  peerConnections.set(userId, pc);
  pendingCandidates.set(userId, []);

  return pc;
};

watch(
  remoteMediaStreams,
  (newVal) => {
    console.log(newVal);
  },
  {
    deep: true,
  }
);
/// Socket handlers
socket.on("user_joined", async (user) => {
  const userId = user.user.id;
  console.log(user.user);
  try {
    const pc = createPeerConnection(userId);

    store.localMedia.getTracks().forEach((track) => {
      pc.addTrack(track, store.localMedia);
      console.log(`➕ Добавлен track: ${track.kind}`);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", {
      target: userId,
      sdp: offer,
    });
  } catch (error) {
    return;
  }
});

socket.on("getOffer", async (sdp) => {
  console.log(sdp.sender);
  if (!sdp.sdp || !sdp.sender) {
    return;
  }
  const userId = sdp.sender;
  try {
    const pc = createPeerConnection(userId);

    store.localMedia.getTracks().forEach((track) => {
      pc.addTrack(track, store.localMedia);
    });
    await pc.setRemoteDescription(sdp.sdp);
    const pending = pendingCandidates.get(userId) || [];
    for (const candidate of pending) {
      await pc.addIceCandidate(candidate);
    }
    pendingCandidates.set(userId, []);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", {
      target: userId,
      sdp: answer,
    });
  } catch (error) {
    return;
  }
});

socket.on("getAnswer", async (sdp) => {
  if (!sdp.sdp || !sdp.sender) {
    return;
  }
  const userId = sdp.sender;

  try {
    const pc = peerConnections.get(userId);
    if (!pc) {
      console.error(`❌ Peer connection не найден для ${userId}`);
      return;
    }

    await pc.setRemoteDescription(sdp.sdp);
    const pending = pendingCandidates.get(userId) || [];
    for (const candidate of pending) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidates.set(userId, []);
  } catch (error) {
    return;
  }
});

socket.on("getCandidate", async ({ candidate, sender }) => {
  if (!sender || !candidate) {
    console.error("❌ Некорректный candidate");
    return;
  }
  try {
    const pc = peerConnections.get(sender);

    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      await pc.addIceCandidate(candidate);
    } else {
      const pending = pendingCandidates.get(sender) || [];
      pending.push(candidate);
      pendingCandidates.set(sender, pending);
    }
  } catch (error) {
    return;
  }
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
  console.log(data);
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
  console.log(data);
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

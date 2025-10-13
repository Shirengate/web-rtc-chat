<template>
  <div class="wrapper">
    <div class="conference-wrapper">
      <conference :len="remoteMediaStreams.length + 1">
        <video
          class="video layout-inner-1"
          autoplay
          playsinline
          :srcObject="store.localMedia"
          ref="my_video_ref"
          muted
          id="my-video"
        ></video>
        <video
          v-for="(media, index) in remoteMediaStreams"
          :key="media.id"
          :class="['video', `layout-inner-${index + 2}`]"
          autoplay
          playsinline
          :srcObject="media.mediaStream"
          ref="remote_video_ref"
          id="remote-video"
        ></video>
      </conference>
    </div>

    <Button
      label="Join room"
      :disabled="disabled"
      @click="callFn"
      class="join-room__btn"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { socket } from "../socket/socket";
import randomName from "@scaleway/random-name";
import Conference from "../components/UI/Conference.vue";
import Button from "primevue/button";
import { useLocalMedia } from "../stores/local-media";
import { useEnableDevice } from "../composables/use-enable-device";
//// variables

const { enableDevice } = useEnableDevice();
const { setAudioMedia, setVideoMedia } = useLocalMedia();
const store = useLocalMedia();
const my_video_ref = ref(null);
const remote_video_ref = ref(null);
const disabled = ref(false);

const remoteMediaStreams = ref([]);
// Хранилище для peer connections (для каждого пользователя отдельное)
const peerConnections = new Map();
const pendingCandidates = new Map();

/// functions
const callFn = async () => {
  if (!store.localMedia) {
    alert("Включите камеру");
    return null;
  }
  socket.emit("join", {
    room: "room_123",
    name: randomName(),
  });
  disabled.value = true;
};

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
    const mediaStream = e.streams[0];
    if (remoteMediaStreams.value.find((m) => m.id === userId)) {
      return;
    }
    remoteMediaStreams.value = [
      ...remoteMediaStreams.value,
      { id: userId, mediaStream },
    ];
  });

  peerConnections.set(userId, pc);
  pendingCandidates.set(userId, []);

  return pc;
};

/// watchers

watch(
  () => store.isVideoEnabled,
  (newVal) => {
    if (newVal) {
      enableDevice("video", peerConnections);
    }
  },
  {
    immediate: false,
  }
);
watch(
  () => store.isAudioEnabled,
  async (newVal) => {
    if (newVal) {
      enableDevice("audio", peerConnections);
    }
  },
  {
    immediate: false,
  }
);
/// Socket handlers

socket.on("user_joined", async (user) => {
  const userId = user.user.id;
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

onMounted(async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    mediaStream.getTracks().forEach((track) => {
      console.log(track);
      if (track.kind === "audio") {
        setAudioMedia(track);
      }
      if (track.kind === "video") {
        setVideoMedia(track);
      }
    });
  } catch (error) {
    return alert("Не удалось получить доступ к камере/микрофону");
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
}

.conference-wrapper {
  flex: 1;
}

.video {
  border: 2px solid #007bff;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  background-color: #000;
  object-fit: cover;
  aspect-ratio: 16/9;
}

.status {
  font-size: 18px;
  font-weight: bold;
  padding: 10px 20px;
  background: #f0f0f0;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .wrapper {
    padding: 15px;
  }

  .join-room__btn {
    bottom: 15px;
    padding: 10px 20px;
    min-width: 120px;
    font-size: 14px;
  }

  .video {
    border-width: 1px;
  }
}

@media (max-width: 480px) {
  .wrapper {
    padding: 10px;
  }
  .join-room__btn {
    bottom: 10px;
    padding: 8px 16px;
    font-size: 14px;
    min-width: 100px;
  }

  :deep(.grid-container) {
    grid-gap: 2px;
  }
}

@media (min-aspect-ratio: 16/9) {
  :deep(.grid-container) {
    width: auto;
    height: 100%;
  }
}

@media (max-aspect-ratio: 4/3) {
  :deep(.grid-container) {
    width: 100%;
    height: auto;
  }
}
</style>

<template>
  <div class="wrapper">
    <video
      class="video"
      autoplay
      playsinline
      ref="my_video_ref"
      muted
      id="my-video"
    ></video>
    <video
      class="video"
      autoplay
      playsinline
      ref="remote_video_ref"
      id="remote-video"
    ></video>

    <button :disabled="disabled" @click="callFn" class="join-room__btn">
      Join room
    </button>
  </div>
</template>

<script setup >
import { onMounted, reactive, ref } from "vue";
import { socket } from "../socket/socket";
import randomName from "@scaleway/random-name";

//// variables
const my_video_ref = ref(null);
const remote_video_ref = ref(null);
const disabled = ref(false);
const remoteUser = reactive({});
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:5349" },
    { urls: "stun:stun1.l.google.com:3478" },
    { urls: "stun:stun1.l.google.com:5349" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
});
const localMedieStream = ref(null);
const userMediaStream = ref(null);

/// functions
const callFn = async () => {
  if (!localMedieStream.value) {
    alert("Включите камеру");
    return null;
  }
  socket.emit("join", {
    room: "room_123",
    name: randomName(),
  });
  disabled.value = true;
};

/// pc handlers

pc.onicecandidate = (e) => {
  const { candidate } = e;
  if (!candidate || !remoteUser.id) {
    return null;
  }
  socket.emit("candidate", {
    target: remoteUser.id,
    candidate,
  });
  console.log("new ice candidate", candidate);
};

pc.addEventListener("track", (e) => {
  const mediaStream = e.streams[0];
  console.log(mediaStream);
  remote_video_ref.value.srcObject = mediaStream;
});
/// sockets_handlers

socket.on("user_joined", async (user) => {
  console.log("✅ New user joined:", user);
  remoteUser.id = user.user.id;
  localMedieStream.value.getTracks().forEach((track) => {
    pc.addTrack(track, localMedieStream.value);
  });

  const offer = await pc.createOffer();

  pc.setLocalDescription(offer);
  socket.emit("offer", {
    target: user.user.id,
    sdp: offer,
  });
});
socket.on("getOffer", async (sdp) => {
  if (!sdp.sdp) {
    return null;
  }
  localMedieStream.value.getTracks().forEach((track) => {
    pc.addTrack(track, localMedieStream.value);
  });

  await pc.setRemoteDescription(sdp.sdp);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("answer", {
    target: sdp.sender,
    sdp: answer,
  });

  console.log("📨 get offer:", sdp);
});

socket.on("getAnswer", async (sdp) => {
  if (!sdp.sdp) {
    return null;
  }
  await pc.setRemoteDescription(sdp.sdp);
});

socket.on("getCandidate", async ({ candidate }) => {
  console.log("thi is candidate", candidate);
  await pc.addIceCandidate(candidate);
});
/// hooks
onMounted(async () => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  if (my_video_ref.value) {
    my_video_ref.value.srcObject = mediaStream;
    localMedieStream.value = mediaStream;
  }
  console.log(mediaStream);
});
</script>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
}

.video {
  border: 2px solid #007bff;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  height: 450px;
  background-color: #000;
  object-fit: cover;
}
.join-room__btn {
  background: none;
  border: none;
  font-size: 30px;
  border: 1px solid gray;
  min-width: 500px;
  background: lightgray;
  border-radius: 10px;
}
@media (max-width: 768px) {
  .video {
    height: 300px;
    max-width: 100%;
  }

  .wrapper {
    gap: 10px;
    padding: 10px;
  }
}
</style>
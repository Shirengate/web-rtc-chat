import { config } from "@assets/peers.js";
import { socket } from "@/socket/socket";
export const createWebRtcManager = (onStreamAdded) => {
  const peerConnections = new Map();
  const pendingCandidates = new Map();
  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("candidate", {
          target: userId,
          candidate: e.candidate,
        });
      }
    };
    pc.addEventListener("track", (e) => {
      if (e.streams && e.streams[0]) {
        onStreamAdded(userId, e.streams[0]);
      }
    });
    peerConnections.set(userId, pc);
    pendingCandidates.set(userId, []);

    return pc;
  };

  const createOffer = async (peerConnection) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", {
      target: userId,
      sdp: offer,
    });
  };

  const createAnswer = async (sdp, peerConnection) => {
    if (!sdp.sdp || !sdp.sender) {
      return;
    }
    const userId = sdp.sender;
    try {
      await peerConnection.setRemoteDescription(sdp.sdp);
      const pending = pendingCandidates.get(userId) || [];
      for (const candidate of pending) {
        await peerConnection.addIceCandidate(candidate);
      }
      pendingCandidates.set(userId, []);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", {
        target: userId,
        sdp: answer,
      });
    } catch (error) {
      return;
    }
  };

  const getCandidate = async (candidate, sender) => {
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
  };

  const getAnswer = async (sdp) => {
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
  };

  return {
    createPeerConnection,
    peerConnections,
    pendingCandidates,
    createAnswer,
    createOffer,
    getCandidate,
    getAnswer,
  };
};

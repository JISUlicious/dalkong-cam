import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  type MediaStream,
} from "react-native-webrtc";

import type { SignalingClient } from "./signalingClient";

export interface PeerSession {
  peerId: string;
  pc: RTCPeerConnection;
  close: () => void;
}

interface CreatePeerSessionOptions {
  peerId: string;
  iceServers: RTCIceServer[];
  signaling: SignalingClient;
  localStream: MediaStream | null;
  role: "camera" | "viewer";
  onRemoteStream: (stream: MediaStream) => void;
  onClosed?: (reason: string) => void;
}

export function createPeerSession(opts: CreatePeerSessionOptions): PeerSession {
  const pc = new RTCPeerConnection({
    iceServers: opts.iceServers,
    iceTransportPolicy: "all",
  });

  // @ts-expect-error react-native-webrtc augments these on its own RTCPeerConnection.
  pc.addEventListener("icecandidate", (event) => {
    if (event.candidate) {
      opts.signaling.send({
        type: "candidate",
        toDeviceId: opts.peerId,
        candidate: event.candidate.toJSON(),
      });
    }
  });

  // @ts-expect-error see above.
  pc.addEventListener("track", (event) => {
    const [remoteStream] = event.streams;
    if (remoteStream) opts.onRemoteStream(remoteStream as unknown as MediaStream);
  });

  // @ts-expect-error see above.
  pc.addEventListener("connectionstatechange", () => {
    const state = pc.connectionState;
    if (state === "failed" || state === "closed") {
      opts.onClosed?.(state);
    }
  });

  if (opts.localStream) {
    for (const track of opts.localStream.getTracks()) {
      pc.addTrack(track, opts.localStream);
    }
  }

  // Viewers initiate the offer; cameras wait for one.
  if (opts.role === "viewer") {
    void (async () => {
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      opts.signaling.send({
        type: "offer",
        toDeviceId: opts.peerId,
        sdp: { type: offer.type as "offer", sdp: offer.sdp ?? "" },
      });
    })();
  }

  return {
    peerId: opts.peerId,
    pc,
    close: () => {
      try {
        pc.close();
      } catch {
        /* ignore */
      }
    },
  };
}

export async function handleRemoteOffer(
  session: PeerSession,
  signaling: SignalingClient,
  sdp: { type: string; sdp: string },
  localStream: MediaStream | null,
): Promise<void> {
  await session.pc.setRemoteDescription(
    new RTCSessionDescription({ type: sdp.type as "offer", sdp: sdp.sdp }),
  );
  if (localStream) {
    for (const track of localStream.getTracks()) {
      const senders = session.pc.getSenders();
      const already = senders.some((s) => s.track === track);
      if (!already) session.pc.addTrack(track, localStream);
    }
  }
  const answer = await session.pc.createAnswer();
  await session.pc.setLocalDescription(answer);
  signaling.send({
    type: "answer",
    toDeviceId: session.peerId,
    sdp: { type: answer.type as "answer", sdp: answer.sdp ?? "" },
  });
}

export async function handleRemoteAnswer(
  session: PeerSession,
  sdp: { type: string; sdp: string },
): Promise<void> {
  if (session.pc.currentRemoteDescription) return;
  await session.pc.setRemoteDescription(
    new RTCSessionDescription({ type: sdp.type as "answer", sdp: sdp.sdp }),
  );
}

export async function handleRemoteCandidate(
  session: PeerSession,
  candidate: unknown,
): Promise<void> {
  try {
    await session.pc.addIceCandidate(
      new RTCIceCandidate(candidate as RTCIceCandidateInit),
    );
  } catch {
    /* race during teardown */
  }
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { MediaStream } from "react-native-webrtc";

import type { ServerMessage } from "@dalkong/shared";

import { getCachedTurnCredentials } from "@/api/turn";
import { SignalingClient } from "./signalingClient";
import {
  createPeerSession,
  handleRemoteAnswer,
  handleRemoteCandidate,
  handleRemoteOffer,
  type PeerSession,
} from "./rtcConnection";

export interface PeerInfo {
  deviceId: string;
  role: "camera" | "viewer";
  name: string;
}

interface ConnectionContextValue {
  signalingReady: boolean;
  peers: Record<string, PeerInfo>;
  remoteStreams: Record<string, MediaStream>;
  start: (opts: {
    deviceId: string;
    deviceSecret: string;
    sessionId: string;
    role: "camera" | "viewer";
    localStream: MediaStream | null;
  }) => void;
  stop: () => void;
  sendRecordingState: (isRecording: boolean) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const signalingRef = useRef<SignalingClient | null>(null);
  const sessionsRef = useRef<Record<string, PeerSession>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const roleRef = useRef<"camera" | "viewer">("viewer");

  const [signalingReady, setSignalingReady] = useState(false);
  const [peers, setPeers] = useState<Record<string, PeerInfo>>({});
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const closePeer = useCallback((deviceId: string) => {
    const session = sessionsRef.current[deviceId];
    if (session) {
      session.close();
      delete sessionsRef.current[deviceId];
    }
    setRemoteStreams((prev) => {
      if (!prev[deviceId]) return prev;
      const next = { ...prev };
      delete next[deviceId];
      return next;
    });
    setPeers((prev) => {
      if (!prev[deviceId]) return prev;
      const next = { ...prev };
      delete next[deviceId];
      return next;
    });
  }, []);

  const onSignalingMessage = useCallback(
    async (msg: ServerMessage) => {
      const signaling = signalingRef.current;
      if (!signaling) return;

      switch (msg.type) {
        case "ready": {
          setSignalingReady(true);
          break;
        }
        case "peer-online": {
          const info: PeerInfo = {
            deviceId: msg.deviceId,
            role: msg.role,
            name: msg.name,
          };
          setPeers((prev) => ({ ...prev, [msg.deviceId]: info }));
          if (sessionsRef.current[msg.deviceId]) break;
          const turn = await getCachedTurnCredentials();
          sessionsRef.current[msg.deviceId] = createPeerSession({
            peerId: msg.deviceId,
            iceServers: turn.iceServers,
            signaling,
            localStream: localStreamRef.current,
            role: roleRef.current,
            onRemoteStream: (stream) =>
              setRemoteStreams((prev) => ({ ...prev, [msg.deviceId]: stream })),
            onClosed: () => closePeer(msg.deviceId),
          });
          break;
        }
        case "peer-offline": {
          closePeer(msg.deviceId);
          break;
        }
        case "offer": {
          let session = sessionsRef.current[msg.fromDeviceId];
          if (!session) {
            const turn = await getCachedTurnCredentials();
            session = createPeerSession({
              peerId: msg.fromDeviceId,
              iceServers: turn.iceServers,
              signaling,
              localStream: localStreamRef.current,
              role: roleRef.current,
              onRemoteStream: (stream) =>
                setRemoteStreams((prev) => ({
                  ...prev,
                  [msg.fromDeviceId]: stream,
                })),
              onClosed: () => closePeer(msg.fromDeviceId),
            });
            sessionsRef.current[msg.fromDeviceId] = session;
          }
          await handleRemoteOffer(
            session,
            signaling,
            msg.sdp,
            localStreamRef.current,
          );
          break;
        }
        case "answer": {
          const session = sessionsRef.current[msg.fromDeviceId];
          if (session) await handleRemoteAnswer(session, msg.sdp);
          break;
        }
        case "candidate": {
          const session = sessionsRef.current[msg.fromDeviceId];
          if (session) await handleRemoteCandidate(session, msg.candidate);
          break;
        }
        case "error": {
          // swallowed; app surfaces issues elsewhere via API errors
          break;
        }
      }
    },
    [closePeer],
  );

  const start: ConnectionContextValue["start"] = useCallback(
    ({ deviceId, deviceSecret, sessionId, role, localStream }) => {
      stopInternal();
      localStreamRef.current = localStream;
      roleRef.current = role;
      const client = new SignalingClient({
        deviceId,
        deviceSecret,
        sessionId,
        onMessage: (msg) => void onSignalingMessage(msg),
      });
      signalingRef.current = client;
      client.connect();
    },
    [onSignalingMessage],
  );

  const stopInternal = useCallback(() => {
    setSignalingReady(false);
    setPeers({});
    setRemoteStreams({});
    for (const id of Object.keys(sessionsRef.current)) {
      sessionsRef.current[id]?.close();
    }
    sessionsRef.current = {};
    signalingRef.current?.close();
    signalingRef.current = null;
    localStreamRef.current = null;
  }, []);

  const stop = useCallback(() => stopInternal(), [stopInternal]);

  const sendRecordingState = useCallback((isRecording: boolean) => {
    signalingRef.current?.send({ type: "recording-state", isRecording });
  }, []);

  useEffect(() => () => stopInternal(), [stopInternal]);

  const value = useMemo<ConnectionContextValue>(
    () => ({
      signalingReady,
      peers,
      remoteStreams,
      start,
      stop,
      sendRecordingState,
    }),
    [signalingReady, peers, remoteStreams, start, stop, sendRecordingState],
  );

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection(): ConnectionContextValue {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be inside ConnectionProvider");
  return ctx;
}

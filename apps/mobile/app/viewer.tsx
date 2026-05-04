import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { mediaDevices, type MediaStream, RTCView } from "react-native-webrtc";

import {
  ConnectionProvider,
  useConnection,
  type PeerInfo,
} from "@/webrtc/ConnectionContext";
import {
  ensureLocalDevice,
  newSessionId,
  type LocalDevice,
} from "@/state/deviceStore";
import { registerPushTokenForDevice } from "@/notifications/registerPush";

function ViewerInner({ device: localDevice }: { device: LocalDevice }) {
  const router = useRouter();
  const { peers, remoteStreams, start, signalingReady } = useConnection();
  const [muted, setMuted] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    let localStream: MediaStream | null = null;
    void (async () => {
      try {
        // Audio-only local track for talkback.
        const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream = stream as unknown as MediaStream;
        // Mute by default.
        localStream.getAudioTracks().forEach((t) => (t.enabled = false));
        start({
          deviceId: localDevice.id,
          deviceSecret: localDevice.secret,
          sessionId: newSessionId(),
          role: "viewer",
          localStream,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("getUserMedia failed", err);
        start({
          deviceId: localDevice.id,
          deviceSecret: localDevice.secret,
          sessionId: newSessionId(),
          role: "viewer",
          localStream: null,
        });
      }
    })();
    return () => {
      cancelled = true;
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, [start, localDevice]);

  const cameras = useMemo<PeerInfo[]>(
    () => Object.values(peers).filter((p) => p.role === "camera"),
    [peers],
  );

  const numColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1;

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="rounded-full bg-neutral-800 px-4 py-2"
        >
          <Text className="text-white">Back</Text>
        </Pressable>
        <Text className="text-xs text-neutral-400">
          {signalingReady ? "Connected" : "Connecting..."}
        </Text>
        <Pressable
          onPress={() => setMuted((m) => !m)}
          className="rounded-full bg-neutral-800 px-4 py-2"
        >
          <Text className="text-white">{muted ? "Mic off" : "Mic on"}</Text>
        </Pressable>
      </View>

      {cameras.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
          <Text className="mt-3 text-neutral-400">
            Waiting for paired cameras to come online...
          </Text>
        </View>
      ) : (
        <FlashList
          data={cameras}
          numColumns={numColumns}
          estimatedItemSize={240}
          keyExtractor={(item) => item.deviceId}
          renderItem={({ item }) => (
            <CameraTile peer={item} stream={remoteStreams[item.deviceId]} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function CameraTile({
  peer,
  stream,
}: {
  peer: PeerInfo;
  stream: MediaStream | undefined;
}) {
  return (
    <View className="m-1 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <View className="aspect-video w-full">
        {stream ? (
          <RTCView
            streamURL={(stream as unknown as { toURL: () => string }).toURL()}
            objectFit="cover"
            style={{ flex: 1 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-base font-semibold text-white" numberOfLines={1}>
          {peer.name || "Camera"}
        </Text>
      </View>
    </View>
  );
}

export default function ViewerScreen() {
  const [device, setDevice] = useState<LocalDevice | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const d = await ensureLocalDevice({ role: "viewer", name: "Mobile Viewer" });
        setDevice(d);
        void registerPushTokenForDevice(d.id);
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, []);

  if (err) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-950 p-6">
        <Text className="text-red-400">Could not register this device:</Text>
        <Text className="mt-2 text-neutral-300">{err}</Text>
      </SafeAreaView>
    );
  }
  if (!device) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-950">
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }
  return (
    <ConnectionProvider>
      <ViewerInner device={device} />
    </ConnectionProvider>
  );
}

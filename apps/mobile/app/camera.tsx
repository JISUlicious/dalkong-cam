import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  type VideoFile,
} from "react-native-vision-camera";
import { mediaDevices, type MediaStream } from "react-native-webrtc";
import { useRouter } from "expo-router";

import { useMotionDetection } from "@/camera/useMotionDetection";
import { useMotionFrameProcessor } from "@/camera/motionFrameProcessor";
import {
  startCameraForegroundService,
  stopCameraForegroundService,
} from "@/camera/foregroundService";
import { uploadRecording } from "@/camera/uploadRecording";
import {
  ensureLocalDevice,
  newSessionId,
  type LocalDevice,
} from "@/state/deviceStore";
import {
  ConnectionProvider,
  useConnection,
} from "@/webrtc/ConnectionContext";

function CameraInner({ device: localDevice }: { device: LocalDevice }) {
  const router = useRouter();
  const { hasPermission: camOk, requestPermission: reqCam } = useCameraPermission();
  const { hasPermission: micOk, requestPermission: reqMic } = useMicrophonePermission();
  const physicalDevice = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);
  const motion = useMotionDetection();
  const frameProcessor = useMotionFrameProcessor(motion.reportMotion);
  const { start, sendRecordingState, peers } = useConnection();
  const [streamReady, setStreamReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const recordingRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!camOk) void reqCam();
    if (!micOk) void reqMic();
  }, [camOk, micOk, reqCam, reqMic]);

  useEffect(() => {
    void startCameraForegroundService({ deviceName: localDevice.name });
    return () => {
      void stopCameraForegroundService();
    };
  }, [localDevice.name]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 24, max: 30 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream as unknown as MediaStream;
        setStreamReady(true);
        start({
          deviceId: localDevice.id,
          deviceSecret: localDevice.secret,
          sessionId: newSessionId(),
          role: "camera",
          localStream: stream as unknown as MediaStream,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("getUserMedia failed", err);
      }
    })();
    return () => {
      cancelled = true;
      const stream = localStreamRef.current;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, [start, localDevice]);

  useEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    if (motion.state.shouldRecord && !recordingRef.current) {
      recordingRef.current = true;
      setRecording(true);
      sendRecordingState(true);
      cam.startRecording({
        fileType: "mp4",
        videoCodec: "h264",
        onRecordingFinished: async (video: VideoFile) => {
          recordingRef.current = false;
          setRecording(false);
          sendRecordingState(false);
          try {
            const fileInfo = await fetch(`file://${video.path}`).then((r) => r.blob());
            await uploadRecording({
              uri: `file://${video.path}`,
              sizeBytes: fileInfo.size,
              durationMs: video.duration ? Math.round(video.duration * 1000) : null,
              recordedAt: new Date(),
              deviceId: localDevice.id,
            });
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("upload failed", err);
          }
        },
        onRecordingError: () => {
          recordingRef.current = false;
          setRecording(false);
          sendRecordingState(false);
        },
      });
    } else if (!motion.state.shouldRecord && recordingRef.current) {
      cam.stopRecording().catch(() => {});
    }
  }, [motion.state.shouldRecord, sendRecordingState, localDevice]);

  if (!camOk || !micOk || !physicalDevice) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-950">
        <ActivityIndicator color="#fff" />
        <Text className="mt-4 text-neutral-300">
          Waiting for camera & microphone permission...
        </Text>
      </SafeAreaView>
    );
  }

  const viewerCount = Object.values(peers).filter(
    (p) => p.role === "viewer",
  ).length;

  return (
    <View className="flex-1 bg-black">
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        device={physicalDevice}
        isActive={true}
        audio
        video
        frameProcessor={frameProcessor}
      />
      <SafeAreaView pointerEvents="box-none" className="absolute inset-0 p-4">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="rounded-full bg-black/60 px-4 py-2"
          >
            <Text className="text-white">Back</Text>
          </Pressable>
          <View className="rounded-full bg-black/60 px-3 py-1.5">
            <Text className="text-xs text-white">
              {streamReady ? "Live" : "Starting..."} · {viewerCount} viewer
              {viewerCount === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        {recording && (
          <View className="mt-2 self-start rounded-full bg-red-600 px-3 py-1">
            <Text className="text-xs font-semibold text-white">REC</Text>
          </View>
        )}

        <View className="mt-auto items-center">
          <Pressable
            onPress={motion.reportMotion}
            className="rounded-2xl bg-white/15 px-5 py-3"
          >
            <Text className="text-white">Trigger motion (debug)</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function CameraScreen() {
  const [device, setDevice] = useState<LocalDevice | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const d = await ensureLocalDevice({ role: "camera", name: "Mobile Camera" });
        setDevice(d);
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
      <CameraInner device={device} />
    </ConnectionProvider>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import type { SavedVideoSummary } from "@dalkong/shared";

import { videosApi } from "@/api/videos";

export default function HistoryScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<SavedVideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<SavedVideoSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await videosApi.list({ limit: 100 });
      setVideos(res.videos);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (selected) {
    return <PlaybackScreen video={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="rounded-full bg-neutral-800 px-4 py-2"
        >
          <Text className="text-white">Back</Text>
        </Pressable>
        <Text className="text-xl font-bold text-white">History</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" />
        </View>
      ) : videos.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-neutral-400">
            No recorded clips yet. They'll appear here once your camera detects
            motion.
          </Text>
        </View>
      ) : (
        <FlashList
          data={videos}
          estimatedItemSize={88}
          keyExtractor={(v) => v.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor="#fff"
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              className="mx-4 my-1 rounded-xl bg-neutral-900 p-4 active:opacity-80"
            >
              <Text className="text-base font-semibold text-white">
                {item.deviceName}
              </Text>
              <Text className="mt-1 text-sm text-neutral-400">
                {new Date(item.recordedAt).toLocaleString()}
                {item.durationMs
                  ? ` · ${(item.durationMs / 1000).toFixed(1)}s`
                  : ""}
                {` · ${(item.sizeBytes / 1024 / 1024).toFixed(1)} MB`}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function PlaybackScreen({
  video,
  onClose,
}: {
  video: SavedVideoSummary;
  onClose: () => void;
}) {
  const player = useVideoPlayer(video.downloadUrl, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center justify-between p-3">
        <Pressable
          onPress={onClose}
          className="rounded-full bg-neutral-800 px-4 py-2"
        >
          <Text className="text-white">Close</Text>
        </Pressable>
        <Text className="text-white" numberOfLines={1}>
          {video.deviceName}
        </Text>
        <View style={{ width: 60 }} />
      </View>
      <VideoView
        player={player}
        style={{ flex: 1 }}
        allowsFullscreen
        nativeControls
      />
    </SafeAreaView>
  );
}

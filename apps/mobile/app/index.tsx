import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <View className="flex-1 px-6 pt-10">
        <Text className="text-3xl font-bold text-white">Dalkong Cam</Text>
        <Text className="mt-2 text-neutral-400">
          Signed in as {user?.email}
        </Text>
        {!user?.emailVerified && (
          <View className="mt-4 rounded-lg border border-amber-500 bg-amber-950/40 p-3">
            <Text className="text-amber-300">
              Please verify your email before pairing devices.
            </Text>
          </View>
        )}

        <View className="mt-10 gap-4">
          <Link href="/camera" asChild>
            <Pressable className="rounded-2xl bg-blue-600 p-5 active:opacity-80">
              <Text className="text-center text-lg font-semibold text-white">
                Use this device as a Camera
              </Text>
              <Text className="mt-1 text-center text-sm text-blue-100">
                Broadcast video, motion-record locally, upload to your server.
              </Text>
            </Pressable>
          </Link>

          <Link href="/viewer" asChild>
            <Pressable className="rounded-2xl bg-emerald-600 p-5 active:opacity-80">
              <Text className="text-center text-lg font-semibold text-white">
                Use this device as a Viewer
              </Text>
              <Text className="mt-1 text-center text-sm text-emerald-100">
                Watch your paired cameras and talk back via audio.
              </Text>
            </Pressable>
          </Link>

          <Link href="/history" asChild>
            <Pressable className="rounded-2xl border border-neutral-700 p-5 active:opacity-80">
              <Text className="text-center text-lg font-semibold text-white">
                History
              </Text>
              <Text className="mt-1 text-center text-sm text-neutral-400">
                Replay motion-triggered recordings.
              </Text>
            </Pressable>
          </Link>
        </View>

        <Pressable
          className="mt-auto mb-4 self-center"
          onPress={() => void signOut()}
        >
          <Text className="text-neutral-500">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

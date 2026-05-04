import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setErr("Invalid email or password.");
      } else if (e instanceof ApiError && e.status === 429) {
        setErr("Too many attempts. Try again in a few minutes.");
      } else {
        setErr("Could not sign in. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-3xl font-bold text-white">Sign in</Text>
          <Text className="mb-8 text-neutral-400">
            Welcome back to Dalkong Cam.
          </Text>

          <Text className="mb-1 text-sm text-neutral-300">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className="mb-4 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white"
            placeholderTextColor="#666"
          />

          <Text className="mb-1 text-sm text-neutral-300">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            className="mb-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white"
            placeholderTextColor="#666"
          />

          {err && (
            <Text className="mt-2 text-sm text-red-400">{err}</Text>
          )}

          <Pressable
            disabled={busy}
            onPress={submit}
            className="mt-6 rounded-xl bg-blue-600 p-4 active:opacity-80 disabled:opacity-60"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-base font-semibold text-white">
                Sign in
              </Text>
            )}
          </Pressable>

          <Link href="/(auth)/sign-up" className="mt-6 self-center">
            <Text className="text-neutral-400">
              No account? <Text className="text-blue-400">Sign up</Text>
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

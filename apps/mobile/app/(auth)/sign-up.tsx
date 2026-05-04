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

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await signUp(email.trim(), password);
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.code === "weak_password") {
        setErr(e.message ?? "Password is too weak.");
      } else if (e instanceof ApiError && e.status === 400) {
        setErr("Please check the email and password.");
      } else {
        setErr("Could not sign up. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-2xl font-bold text-white">Check your inbox</Text>
          <Text className="mt-3 text-center text-neutral-400">
            We've sent a verification link to {email}. Click it to activate your
            account, then sign in.
          </Text>
          <Link href="/(auth)/sign-in" className="mt-8">
            <Text className="text-blue-400">Back to sign in</Text>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-3xl font-bold text-white">Sign up</Text>
          <Text className="mb-8 text-neutral-400">
            Create a Dalkong Cam account on your server.
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

          <Text className="mb-1 text-sm text-neutral-300">
            Password (min. 12 characters)
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white"
            placeholderTextColor="#666"
          />

          {err && (
            <Text className="mt-3 text-sm text-red-400">{err}</Text>
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
                Create account
              </Text>
            )}
          </Pressable>

          <Link href="/(auth)/sign-in" className="mt-6 self-center">
            <Text className="text-neutral-400">
              Already have an account?{" "}
              <Text className="text-blue-400">Sign in</Text>
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

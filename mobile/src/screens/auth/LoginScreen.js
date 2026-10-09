import React, { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { errMsg } from "../../utils";

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return Alert.alert("Missing details", "Enter your email and password.");
    try {
      setBusy(true);
      await login(email, password);
    } catch (e) {
      Alert.alert("Login failed", errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-ink" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pb-12" style={{ paddingTop: insets.top + 48 }}>
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-brand">
            <Ionicons name="school" size={34} color="#0B0B0F" />
          </View>
          <Text className="mt-8 text-4xl font-extrabold font-roboto text-white">Welcome back</Text>
          <Text className="mt-2 text-base text-white/60">Sign in to see your courses and student QR.</Text>
        </View>

        <View className="flex-1 rounded-t-[32px] bg-surface px-6 pt-8" style={{ paddingBottom: insets.bottom + 24 }}>
          <Input
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            icon="lock-closed-outline"
            placeholder="Your password"
            secure
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <Button title="Sign in" onPress={submit} loading={busy} className="mt-2" />

          <View className="mt-8 flex-row items-center justify-center">
            <Text className="text-gray-500">New student? </Text>
            <Pressable onPress={() => navigation.navigate("Register")} hitSlop={10}>
              <Text className="font-extrabold text-ink">Create account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

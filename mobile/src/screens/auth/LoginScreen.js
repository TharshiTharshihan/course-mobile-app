import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, Logo } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { errMsg } from "../../utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Enter your email";
    else if (!EMAIL_RE.test(email.trim())) e.email = "That doesn't look like an email";
    if (!password) e.password = "Enter your password";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setFormError("");
    if (!validate()) return;
    try {
      setBusy(true);
      await login(email.trim(), password);
    } catch (e) {
      setFormError(
        e?.code === "ECONNABORTED"
          ? "The server is taking a while to wake up. Please try again in a moment."
          : errMsg(e)
      );
    } finally {
      setBusy(false);
    }
  };

  const sheetStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-ink" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <View className="px-6 pb-12" style={{ paddingTop: insets.top + 40 }}>
          <View className="flex-row items-center">
            <Logo size={52} />
            <View className="ml-3">
              <Text className="text-base text-white" style={{ fontFamily: "Poppins_600SemiBold" }}>
                Student Management
              </Text>
              <Text className="text-xs font-bold uppercase tracking-widest text-brand">QR System</Text>
            </View>
          </View>
          <Text className="mt-10 text-4xl text-white" style={{ fontFamily: "Poppins_700Bold" }}>
            Welcome back
          </Text>
          <Text className="mt-2 text-base text-white/60">Sign in to see your courses and student QR.</Text>
        </View>

        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: "#F4F5F7",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: insets.bottom + 24,
            },
            sheetStyle,
          ]}
        >
          {formError ? (
            <View className="mb-5 flex-row items-start rounded-2xl bg-red-50 p-4">
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text className="ml-2 flex-1 text-sm font-semibold text-red-600">{formError}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((p) => ({ ...p, email: null }));
            }}
            error={errors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <Input
            ref={passwordRef}
            label="Password"
            icon="lock-closed-outline"
            placeholder="Your password"
            secure
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((p) => ({ ...p, password: null }));
            }}
            error={errors.password}
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          <Button title="Sign in" icon="arrow-forward" onPress={submit} loading={busy} className="mt-2" />

          <View className="my-8 flex-row items-center">
            <View className="h-px flex-1 bg-gray-200" />
            <Text className="mx-3 text-xs font-semibold uppercase tracking-widest text-gray-400">New here?</Text>
            <View className="h-px flex-1 bg-gray-200" />
          </View>

          <Button title="Create student account" variant="outline" icon="person-add-outline" onPress={() => navigation.navigate("Register")} />

          <View className="mt-auto flex-row items-center justify-center pt-8">
            <Ionicons name="shield-checkmark-outline" size={14} color="#9CA3AF" />
            <Text className="ml-1 text-xs text-gray-400">Your session is stored securely on this device</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import React, { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Hero, Input, Sheet } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { errMsg } from "../../utils";

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [f, setF] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.fullName || !f.phone || !f.email || !f.password || !f.confirm)
      return Alert.alert("Missing details", "Name, phone, email, password and confirmation are required.");
    if (f.password.length < 5) return Alert.alert("Weak password", "Use at least 5 characters.");
    if (f.password !== f.confirm) return Alert.alert("Passwords differ", "The two passwords do not match.");
    try {
      setBusy(true);
      await register({ ...f, confirmPassword: f.confirm });
    } catch (e) {
      Alert.alert("Registration failed", errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Hero title="Create account" titleStyle={{ fontFamily: "Poppins_700Bold" }} subtitle="Register once, get your personal student QR." onBack={() => navigation.goBack()} />
      <Sheet>
        <ScrollView
          className="px-5 pt-6"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input label="Full name" icon="person-outline" placeholder="Kasun Perera" value={f.fullName} onChangeText={set("fullName")} />
          <Input label="Email" icon="mail-outline" placeholder="you@example.com" value={f.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Phone" icon="call-outline" placeholder="07X XXX XXXX" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
          <Input label="Password" icon="lock-closed-outline" placeholder="Min 5 characters" secure value={f.password} onChangeText={set("password")} autoCapitalize="none" />
          <Input label="Confirm password" icon="lock-closed-outline" placeholder="Repeat password" secure value={f.confirm} onChangeText={set("confirm")} autoCapitalize="none" />
          <View className="mt-2">
            <Button title="Sign up" onPress={submit} loading={busy} />
          </View>
        </ScrollView>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

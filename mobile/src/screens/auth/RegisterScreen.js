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
    studentId: "",
    email: "",
    phone: "",
    department: "",
    batch: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.fullName || !f.studentId || !f.email || !f.password)
      return Alert.alert("Missing details", "Name, student ID, email and password are required.");
    if (f.password.length < 6) return Alert.alert("Weak password", "Use at least 6 characters.");
    if (f.password !== f.confirm) return Alert.alert("Passwords differ", "The two passwords do not match.");
    try {
      setBusy(true);
      const { confirm, ...payload } = f;
      await register(payload);
    } catch (e) {
      Alert.alert("Registration failed", errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Hero title="Create account" subtitle="Register once, get your personal student QR." onBack={() => navigation.goBack()} />
      <Sheet>
        <ScrollView
          className="px-5 pt-6"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input label="Full name" icon="person-outline" placeholder="Kasun Perera" value={f.fullName} onChangeText={set("fullName")} />
          <Input label="Student ID" icon="id-card-outline" placeholder="EG/2021/1234" value={f.studentId} onChangeText={set("studentId")} autoCapitalize="characters" />
          <Input label="Email" icon="mail-outline" placeholder="you@example.com" value={f.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Phone" icon="call-outline" placeholder="07X XXX XXXX" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
          <Input label="Department" icon="business-outline" placeholder="Computer Engineering" value={f.department} onChangeText={set("department")} />
          <Input label="Batch / Year" icon="calendar-outline" placeholder="2021/22" value={f.batch} onChangeText={set("batch")} />
          <Input label="Password" icon="lock-closed-outline" placeholder="Min 6 characters" secure value={f.password} onChangeText={set("password")} autoCapitalize="none" />
          <Input label="Confirm password" icon="lock-closed-outline" placeholder="Repeat password" secure value={f.confirm} onChangeText={set("confirm")} autoCapitalize="none" />
          <View className="mt-2">
            <Button title="Sign up" onPress={submit} loading={busy} />
          </View>
        </ScrollView>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

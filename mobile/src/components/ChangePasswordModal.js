import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api";
import { Button, Input } from "./ui";
import { errMsg } from "../utils";

const MIN = 5;

/** Bottom sheet to change the signed-in user's password. onDone receives the updated user. */
export default function ChangePasswordModal({ visible, onClose, onDone, forced = false }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setF({ current: "", next: "", confirm: "" });
      setErrors({});
      setFormError("");
    }
  }, [visible]);

  const set = (k) => (t) => {
    setF((p) => ({ ...p, [k]: t }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: null }));
  };

  const submit = async () => {
    const e = {};
    if (!f.current) e.current = "Enter your current password";
    if (f.next.length < MIN) e.next = `At least ${MIN} characters`;
    else if (f.next === f.current) e.next = "Choose a different password";
    if (f.confirm !== f.next) e.confirm = "Passwords do not match";
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      setBusy(true);
      setFormError("");
      const { data } = await api.put("/auth/password", {
        currentPassword: f.current,
        newPassword: f.next,
        confirmPassword: f.confirm,
      });
      onDone?.(data);
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-[28px] bg-surface p-5 pb-8">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-xl font-extrabold text-ink">Change password</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color="#0B0B0F" />
            </Pressable>
          </View>
          <Text className="mb-5 text-sm text-gray-500">
            {forced ? "You're using the default password. Set your own to secure the admin account." : "Use at least 5 characters."}
          </Text>

          {formError ? (
            <View className="mb-4 flex-row items-start rounded-2xl bg-red-50 p-3">
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text className="ml-2 flex-1 text-sm font-semibold text-red-600">{formError}</Text>
            </View>
          ) : null}

          <Input label="Current password" icon="lock-closed-outline" secure value={f.current} onChangeText={set("current")} error={errors.current} autoCapitalize="none" />
          <Input label="New password" icon="key-outline" secure value={f.next} onChangeText={set("next")} error={errors.next} autoCapitalize="none" />
          <Input label="Confirm new password" icon="key-outline" secure value={f.confirm} onChangeText={set("confirm")} error={errors.confirm} autoCapitalize="none" />
          <Button title="Update password" icon="checkmark" onPress={submit} loading={busy} className="mt-1" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

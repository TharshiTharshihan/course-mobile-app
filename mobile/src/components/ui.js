import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colorFor, initials } from "../utils";

/** Dark rounded header, Uber / PickMe style */
export function Hero({ title, subtitle, onBack, right, children, titleStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-ink px-5 pb-10" style={{ paddingTop: insets.top + 12 }}>
      <View className="h-10 flex-row items-center justify-between">
        {onBack ? (
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
        ) : (
          <View />
        )}
        {right}
      </View>
      <Text className="mt-3 text-3xl font-extrabold text-white" style={titleStyle} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-base text-white/60" numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

/** White/grey sheet that slides over the Hero */
export function Sheet({ children, className = "" }) {
  return <View className={`-mt-6 flex-1 rounded-t-[28px] bg-surface ${className}`}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  className = "",
  titleClassName = "",
  titleStyle,
}) {
  const bg = {
    primary: "bg-brand",
    dark: "bg-ink",
    outline: "border border-gray-300 bg-white",
    danger: "bg-red-500",
    soft: "bg-brand-soft",
  };
  const fg = {
    primary: "text-ink",
    dark: "text-white",
    outline: "text-ink",
    danger: "text-white",
    soft: "text-ink",
  };
  const iconColor = { primary: "#0B0B0F", dark: "#fff", outline: "#0B0B0F", danger: "#fff", soft: "#0B0B0F" };
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      className={`h-14 flex-row items-center justify-center rounded-2xl px-5 active:opacity-80 ${bg[variant]} ${
        off ? "opacity-50" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={iconColor[variant]} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={iconColor[variant]} style={{ marginRight: 8 }} /> : null}
          <Text className={`text-base font-bold ${fg[variant]} ${titleClassName}`} style={titleStyle}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function ConfirmModal({ visible, title, message, confirmLabel = "Confirm", onCancel, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-3xl bg-white p-6">
          <Text className="text-xl font-extrabold text-ink">{title}</Text>
          {message ? <Text className="mt-2 text-base leading-6 text-gray-500">{message}</Text> : null}
          <View className="mt-6 flex-row justify-end gap-3">
            <Pressable onPress={onCancel} className="rounded-2xl border border-gray-200 px-5 py-3 active:opacity-70">
              <Text className="font-bold text-ink">Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} className="rounded-2xl bg-red-500 px-5 py-3 active:opacity-80">
              <Text className="font-bold text-white">{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Input({ label, icon, secure, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <View className="mb-4">
      {label ? <Text className="mb-1.5 text-sm font-semibold text-gray-700">{label}</Text> : null}
      <View
        className={`flex-row rounded-2xl border border-gray-200 bg-white px-4 ${
          props.multiline ? "min-h-[96px] items-start py-3" : "h-14 items-center"
        }`}
      >
        {icon ? <Ionicons name={icon} size={20} color="#8A8F98" style={{ marginRight: 10 }} /> : null}
        <TextInput
          className="flex-1 text-base text-ink outline-none"
          placeholderTextColor="#A0A5AD"
          secureTextEntry={secure && !show}
          style={{ outlineStyle: "none" }}
          textAlignVertical={props.multiline ? "top" : "center"}
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setShow(!show)} hitSlop={10}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color="#8A8F98" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Card({ children, className = "", onPress }) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} className={`rounded-3xl bg-white p-4 shadow-sm ${onPress ? "active:opacity-80" : ""} ${className}`}>
      {children}
    </Comp>
  );
}

export function Avatar({ name, size = 48 }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colorFor(name) }}
      className="items-center justify-center"
    >
      <Text className="font-extrabold text-ink" style={{ fontSize: size * 0.36 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

export function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center border-b border-gray-100 py-3">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
        <Ionicons name={icon} size={18} color="#0B0B0F" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</Text>
        <Text className="text-base font-semibold text-ink">{value}</Text>
      </View>
    </View>
  );
}

export function Empty({ icon = "folder-open-outline", title, text }) {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white">
        <Ionicons name={icon} size={36} color="#8A8F98" />
      </View>
      <Text className="text-lg font-bold text-ink">{title}</Text>
      {text ? <Text className="mt-1 text-center text-gray-500">{text}</Text> : null}
    </View>
  );
}

export function Loader() {
  return (
    <View className="items-center py-16">
      <ActivityIndicator size="large" color="#0B0B0F" />
    </View>
  );
}

/** Bottom-sheet form used for add / edit dialogs */
export function FormModal({ visible, title, fields, initial, submitLabel = "Save", onClose, onSubmit }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setValues(initial || {});
  }, [visible]);

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit(values);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-[28px] bg-surface p-5 pb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-extrabold text-ink">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color="#0B0B0F" />
            </Pressable>
          </View>
          {fields.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              value={values[f.key] || ""}
              onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
              multiline={f.multiline}
              autoCapitalize={f.autoCapitalize}
              keyboardType={f.keyboardType}
            />
          ))}
          <Button title={submitLabel} onPress={submit} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

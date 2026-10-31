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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colorFor, firstName, greeting, initials, todayLabel } from "../utils";

/** Dark rounded header, Uber / PickMe style */
export function Hero({ title, subtitle, onBack, left, right, eyebrow, children, titleStyle }) {
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
          left || <View />
        )}
        {right}
      </View>
      {eyebrow ? <Text className="mt-4 text-lg font-semibold text-brand">{eyebrow}</Text> : null}
      <Text className={`${eyebrow ? "" : "mt-3"} text-3xl font-extrabold text-white`} style={titleStyle} numberOfLines={2}>
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

export function Input({ ref, label, icon, secure, error, onFocus, onBlur, ...props }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const border = error ? "border-red-400" : focused ? "border-brand-dark" : "border-gray-200";
  const iconColor = error ? "#F87171" : focused ? "#0B0B0F" : "#8A8F98";
  return (
    <View className="mb-4">
      {label ? <Text className="mb-1.5 text-sm font-semibold text-gray-700">{label}</Text> : null}
      <View
        className={`flex-row rounded-2xl border-2 bg-white px-4 ${border} ${
          props.multiline ? "min-h-[96px] items-start py-3" : "h-14 items-center"
        }`}
      >
        {icon ? <Ionicons name={icon} size={20} color={iconColor} style={{ marginRight: 10 }} /> : null}
        <TextInput
          ref={ref}
          className="flex-1 text-base text-ink outline-none"
          placeholderTextColor="#A0A5AD"
          secureTextEntry={secure && !show}
          style={{ outlineStyle: "none" }}
          textAlignVertical={props.multiline ? "top" : "center"}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setShow(!show)} hitSlop={10}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color="#8A8F98" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="ml-1 mt-1 text-xs font-semibold text-red-500">{error}</Text> : null}
    </View>
  );
}

/** App mark: QR icon on a brand-yellow tile */
export function Logo({ size = 64 }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
      className="items-center justify-center bg-brand"
    >
      <Ionicons name="qr-code" size={size * 0.52} color="#0B0B0F" />
    </View>
  );
}

/** Hero variant for home screens: "Good morning, Name" with today's date */
export function GreetingHero({ name, subtitle, right, children }) {
  const g = greeting();
  return (
    <Hero
      title={`${firstName(name) || "there"} 👋`}
      titleStyle={{ fontFamily: "Poppins_700Bold" }}
      subtitle={subtitle}
      right={right}
      left={
        <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
          <Ionicons name={g.icon} size={15} color="#FFC400" />
          <Text className="ml-1.5 text-xs font-bold text-white/80">{todayLabel()}</Text>
        </View>
      }
      eyebrow={g.text + ","}
    >
      {children}
    </Hero>
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

/** Small uppercase heading above a group of content, with an optional action on the right */
export function SectionTitle({ title, action, onAction, className = "" }) {
  return (
    <View className={`mb-3 mt-8 flex-row items-center justify-between ${className}`}>
      <Text className="text-sm font-extrabold uppercase tracking-widest text-gray-400">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-sm font-bold text-ink">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Round translucent button for the dark Hero header */
export function HeaderButton({ icon, onPress, badge }) {
  return (
    <Pressable onPress={onPress} className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70">
      <Ionicons name={icon} size={20} color="#fff" />
      {badge ? <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand" /> : null}
    </Pressable>
  );
}

/** Horizontal, scrollable single-choice pills. options: [{ value, label, icon? }] */
export function ChipRow({ options, value, onChange, dark = false, className = "" }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className={className} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        const base = dark
          ? on
            ? "bg-brand"
            : "bg-white/10"
          : on
          ? "bg-ink"
          : "border border-gray-200 bg-white";
        const fg = on ? (dark ? "#0B0B0F" : "#FFFFFF") : dark ? "#FFFFFF" : "#0B0B0F";
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            className={`h-10 flex-row items-center rounded-full px-4 active:opacity-80 ${base}`}
          >
            {o.icon ? <Ionicons name={o.icon} size={15} color={fg} style={{ marginRight: 6 }} /> : null}
            <Text className="text-sm font-bold" style={{ color: fg }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Two or three equal tabs inside a pill track */
export function Segmented({ options, value, onChange, className = "" }) {
  return (
    <View className={`flex-row rounded-2xl bg-gray-200/70 p-1 ${className}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`h-10 flex-1 items-center justify-center rounded-xl ${on ? "bg-white shadow-sm" : ""}`}
          >
            <Text className={`text-sm font-bold ${on ? "text-ink" : "text-gray-500"}`}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Tinted label, e.g. a notice type */
export function Badge({ label, icon, color = "#0B0B0F", bg = "#F3F4F6" }) {
  return (
    <View className="flex-row items-center self-start rounded-full px-2.5 py-1" style={{ backgroundColor: bg }}>
      {icon ? <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} /> : null}
      <Text className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

/** Coloured strip for warnings / tips with an optional action */
export function Banner({ icon = "alert-circle", title, text, action, onAction, tone = "warn" }) {
  const t = {
    warn: { bg: "#FFF4CC", fg: "#7A5B00", icon: "#E0A800" },
    danger: { bg: "#FEE2E2", fg: "#991B1B", icon: "#EF4444" },
    info: { bg: "#E0F2FE", fg: "#075985", icon: "#0284C7" },
  }[tone];
  return (
    <View className="mb-4 flex-row items-start rounded-3xl p-4" style={{ backgroundColor: t.bg }}>
      <Ionicons name={icon} size={22} color={t.icon} />
      <View className="ml-3 flex-1">
        <Text className="text-sm font-extrabold" style={{ color: t.fg }}>
          {title}
        </Text>
        {text ? (
          <Text className="mt-0.5 text-sm" style={{ color: t.fg }}>
            {text}
          </Text>
        ) : null}
        {action ? (
          <Pressable onPress={onAction} className="mt-3 self-start rounded-full bg-ink px-4 py-2 active:opacity-80">
            <Text className="text-xs font-bold text-white">{action}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Stat tile used on dashboards */
export function StatCard({ icon, label, value, loading, tint = "#FFC400", onPress }) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} className="flex-1 rounded-3xl bg-white p-4 shadow-sm active:opacity-80">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: tint }}>
        <Ionicons name={icon} size={20} color="#0B0B0F" />
      </View>
      {loading ? (
        <View className="my-2 h-6 w-10 rounded-lg bg-gray-100" />
      ) : (
        <Text className="text-3xl font-extrabold text-ink" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      )}
      <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400" numberOfLines={1}>
        {label}
      </Text>
    </Comp>
  );
}

/** Floating "+" button */
export function Fab({ icon = "add", onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-5 right-5 h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-80"
    >
      <Ionicons name={icon} size={30} color="#0B0B0F" />
    </Pressable>
  );
}

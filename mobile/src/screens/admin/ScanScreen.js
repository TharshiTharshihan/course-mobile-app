import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";
import { Avatar, Button, ChipRow } from "../../components/ui";
import { errMsg, formatTime } from "../../utils";

const RESULT = {
  marked: { icon: "checkmark-circle", color: "#10B981", bg: "#ECFDF5", title: "Marked present" },
  already: { icon: "time", color: "#E0A800", bg: "#FFF8E1", title: "Already marked" },
  invalid: { icon: "close-circle", color: "#EF4444", bg: "#FEF2F2", title: "Invalid QR code" },
  not_found: { icon: "person-remove", color: "#EF4444", bg: "#FEF2F2", title: "Student not found" },
  revoked: { icon: "ban", color: "#EF4444", bg: "#FEF2F2", title: "QR code replaced" },
  error: { icon: "cloud-offline", color: "#EF4444", bg: "#FEF2F2", title: "Could not check" },
};

export default function ScanScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(false);
  const [torch, setTorch] = useState(false);
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState("general");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [count, setCount] = useState(0);
  const locked = useRef(false);
  const lastCode = useRef({ code: "", at: 0 });
  const hideTimer = useRef(null);
  const slide = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
      setActive(true);
      api.get("/courses").then(({ data }) => setCourses(data)).catch(() => {});
      return () => {
        setActive(false);
        setTorch(false);
      };
    }, [])
  );

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const show = (r) => {
    setResult(r);
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    clearTimeout(hideTimer.current);
    // Successful scans clear themselves so the next student can step up; problems wait for a tap.
    if (r.status === "marked" || r.status === "already") hideTimer.current = setTimeout(dismiss, 2600);
  };

  const dismiss = () => {
    clearTimeout(hideTimer.current);
    setResult(null);
    locked.current = false;
  };

  const onScan = async ({ data }) => {
    if (locked.current) return;
    // The camera reports the same code many times a second; ignore repeats for a moment.
    const now = Date.now();
    if (lastCode.current.code === data && now - lastCode.current.at < 4000) return;
    lastCode.current = { code: data, at: now };
    locked.current = true;
    setChecking(true);
    try {
      const { data: r } = await api.post("/attendance/scan", {
        code: data,
        course: course === "general" ? null : course,
      });
      if (r.status === "marked") setCount((c) => c + 1);
      show(r);
    } catch (e) {
      const status = e.response?.data?.status;
      show({ status: RESULT[status] ? status : "error", message: errMsg(e) });
    } finally {
      setChecking(false);
    }
  };

  if (!permission) return <View className="flex-1 bg-ink" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-ink px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-brand">
          <Ionicons name="camera" size={36} color="#0B0B0F" />
        </View>
        <Text className="text-center text-2xl text-white" style={{ fontFamily: "Poppins_700Bold" }}>
          Camera access needed
        </Text>
        <Text className="mb-8 mt-2 text-center text-white/60">Allow the camera to scan student QR codes for attendance.</Text>
        <Button title="Allow camera" onPress={requestPermission} className="w-full" />
      </View>
    );
  }

  const look = result ? RESULT[result.status] || RESULT.error : null;
  const classOptions = [
    { value: "general", label: "General", icon: "apps" },
    ...courses.map((c) => ({ value: c._id, label: c.code })),
  ];

  return (
    <View className="flex-1 bg-ink">
      {active ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={result ? undefined : onScan}
        />
      ) : null}

      <View pointerEvents="box-none" className="absolute inset-0">
        <View className="bg-ink/85 pb-4" style={{ paddingTop: insets.top + 12 }}>
          <View className="flex-row items-center justify-between px-5">
            <View>
              <Text className="text-3xl text-white" style={{ fontFamily: "Poppins_700Bold" }}>
                Attendance
              </Text>
              <Text className="mt-0.5 text-sm text-white/60">Choose the class, then scan each student</Text>
            </View>
            <View className="items-center rounded-2xl bg-white/10 px-3 py-1.5">
              <Text className="text-lg font-extrabold text-brand">{count}</Text>
              <Text className="text-[10px] font-bold uppercase text-white/60">This session</Text>
            </View>
          </View>
          <ChipRow dark className="mt-4" options={classOptions} value={course} onChange={setCourse} />
        </View>

        <View className="flex-1 items-center justify-center" pointerEvents="none">
          <View className="h-64 w-64 items-center justify-center rounded-[32px] border-4 border-brand">
            {checking ? (
              <View className="rounded-full bg-ink/80 px-4 py-2">
                <Text className="font-bold text-white">Checking…</Text>
              </View>
            ) : null}
          </View>
        </View>

        {result ? (
          <Animated.View
            className="mx-4 mb-6 rounded-3xl bg-white p-5"
            style={{
              opacity: slide,
              transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            }}
          >
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: look.bg }}>
                <Ionicons name={look.icon} size={28} color={look.color} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-extrabold" style={{ color: look.color }}>
                  {look.title}
                </Text>
                <Text className="text-sm text-gray-500" numberOfLines={2}>
                  {result.student
                    ? result.status === "already"
                      ? `Checked in at ${formatTime(result.markedAt)}`
                      : `${result.course ? result.course.code : "General"} · ${formatTime(result.markedAt)}`
                    : result.message}
                </Text>
              </View>
            </View>

            {result.student ? (
              <Pressable
                onPress={() => {
                  dismiss();
                  navigation.navigate("StudentDetail", { id: result.student._id });
                }}
                className="mt-4 flex-row items-center rounded-2xl bg-surface p-3 active:opacity-80"
              >
                <Avatar name={result.student.fullName} size={40} />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-ink">{result.student.fullName}</Text>
                  <Text className="text-xs text-gray-500">
                    {result.student.studentId}
                    {result.student.batch ? ` · ${result.student.batch}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            ) : null}

            <Button className="mt-4" variant={result.student ? "dark" : "primary"} icon="scan" title="Scan next" onPress={dismiss} />
          </Animated.View>
        ) : (
          <View className="items-center pb-8" pointerEvents="box-none">
            <Pressable
              onPress={() => setTorch((t) => !t)}
              className={`h-16 w-16 items-center justify-center rounded-full ${torch ? "bg-brand" : "bg-white/20"}`}
            >
              <Ionicons name={torch ? "flash" : "flash-outline"} size={28} color={torch ? "#0B0B0F" : "#fff"} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

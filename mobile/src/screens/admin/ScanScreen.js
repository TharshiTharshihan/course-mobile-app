import React, { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";
import { Button } from "../../components/ui";
import { parseQrPayload } from "../../components/StudentQR";
import { errMsg } from "../../utils";

export default function ScanScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(false);
  const [torch, setTorch] = useState(false);
  const locked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
      setActive(true);
      return () => {
        setActive(false);
        setTorch(false);
      };
    }, [])
  );

  const unlock = () => {
    locked.current = false;
  };

  const onScan = async ({ data }) => {
    if (locked.current) return;
    locked.current = true;

    const info = parseQrPayload(data);
    if (!info) {
      Alert.alert("Not a student QR", data.length > 200 ? `${data.slice(0, 200)}…` : data, [
        { text: "Scan again", onPress: unlock },
      ]);
      return;
    }
    try {
      const { data: student } = await api.get(`/students/${info.id || info.studentId}`);
      navigation.navigate("StudentDetail", { id: student._id });
      setTimeout(unlock, 1500);
    } catch (e) {
      const missing = e.response?.status === 404;
      Alert.alert(
        missing ? "Student not found" : "Error",
        missing ? `${info.name || "This student"} (${info.studentId}) is not in the database.` : errMsg(e),
        [{ text: "Scan again", onPress: unlock }]
      );
    }
  };

  if (!permission) return <View className="flex-1 bg-ink" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-ink px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-brand">
          <Ionicons name="camera" size={36} color="#0B0B0F" />
        </View>
        <Text className="text-center text-2xl font-extrabold text-white">Camera access needed</Text>
        <Text className="mb-8 mt-2 text-center text-white/60">Allow the camera to scan student QR codes.</Text>
        <Button title="Allow camera" onPress={requestPermission} className="w-full" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      {active ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={onScan}
        />
      ) : null}

      <View pointerEvents="box-none" className="absolute inset-0">
        <View className="bg-ink/80 px-5 pb-6" style={{ paddingTop: insets.top + 16 }}>
          <Text className="text-3xl font-extrabold text-white">Scan QR</Text>
          <Text className="mt-1 text-base text-white/60">Point the camera at a student QR code</Text>
        </View>

        <View className="flex-1 items-center justify-center" pointerEvents="none">
          <View className="h-64 w-64 rounded-[32px] border-4 border-brand" />
        </View>

        <View className="items-center pb-8" pointerEvents="box-none">
          <Pressable
            onPress={() => setTorch((t) => !t)}
            className={`h-16 w-16 items-center justify-center rounded-full ${torch ? "bg-brand" : "bg-white/20"}`}
          >
            <Ionicons name={torch ? "flash" : "flash-outline"} size={28} color={torch ? "#0B0B0F" : "#fff"} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

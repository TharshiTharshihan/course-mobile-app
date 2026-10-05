import React, { useRef, useState } from "react";
import { View, Text, Alert, Platform } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Button } from "./ui";

// QR content is plain (unencrypted) JSON.
export const buildQrPayload = (s) =>
  JSON.stringify({ type: "student", id: s._id, studentId: s.studentId, name: s.fullName, email: s.email });

export const parseQrPayload = (text) => {
  try {
    const o = JSON.parse(text);
    if (o && o.type === "student" && (o.id || o.studentId)) return o;
  } catch {}
  return null;
};

export default function StudentQR({ student, showActions = true }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    try {
      setBusy(true);
      if (!ref.current) {
        throw new Error("The QR code is not ready to export. Please try again.");
      }
      const uri = await captureRef(ref.current, {
        format: "png",
        quality: 1,
        result: Platform.OS === "web" ? "data-uri" : "tmpfile",
      });
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = uri;
        link.download = `QR-${student.studentId}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Not supported", "Sharing is not available on this device.");
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: `QR - ${student.studentId}` });
    } catch (e) {
      Alert.alert("Could not export QR", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <View ref={ref} collapsable={false} className="items-center rounded-3xl bg-white p-6 shadow-sm">
        <View className="mb-4 rounded-full bg-brand px-4 py-1">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-ink">Student ID</Text>
        </View>
        <View className="rounded-2xl bg-white p-3">
          <QRCode value={buildQrPayload(student)} size={210} color="#0B0B0F" backgroundColor="#FFFFFF" />
        </View>
        <Text className="mt-4 text-xl font-extrabold text-ink">{student.fullName}</Text>
        <Text className="mt-0.5 text-base font-semibold text-gray-500">{student.studentId}</Text>
        {student.department ? <Text className="mt-0.5 text-sm text-gray-400">{student.department}</Text> : null}
      </View>
      {showActions ? (
        <Button
          className="mt-4"
          variant="dark"
          icon="download-outline"
          title="Download / Share QR"
          onPress={download}
          loading={busy}
        />
      ) : null}
    </View>
  );
}

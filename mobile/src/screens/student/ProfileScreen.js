import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, ConfirmModal, FormModal, Hero, InfoRow, SectionTitle, Sheet, StatCard } from "../../components/ui";
import StudentQR from "../../components/StudentQR";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { dayLabel, errMsg, formatTime } from "../../utils";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [att, setAtt] = useState(null);

  useFocusEffect(
    useCallback(() => {
      api.get("/attendance/me").then(({ data }) => setAtt(data)).catch(() => {});
      // Refresh the profile so the QR is current (e.g. after the teacher issued a new one).
      api.get("/auth/me").then(({ data }) => updateUser(data)).catch(() => {});
    }, [])
  );

  const save = async (values) => {
    try {
      const { data } = await api.put("/auth/me", { fullName: values.fullName, phone: values.phone });
      updateUser(data);
      setEditing(false);
    } catch (e) {
      Alert.alert("Could not save", errMsg(e));
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <Hero title="My QR" titleStyle={{ fontFamily: "Poppins_700Bold" }} subtitle="Show this at class to mark your attendance" />
      <Sheet>
        <ScrollView className="px-5 pt-6" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <StudentQR student={user} />

          <SectionTitle title="My attendance" />
          <View className="flex-row gap-3">
            <StatCard icon="calendar" label="This month" value={att ? att.thisMonth : "–"} tint="#C9F2D0" />
            <StatCard icon="checkmark-done" label="All time" value={att ? att.totalDays : "–"} />
          </View>
          {att?.records?.length ? (
            <Card className="mt-3 py-1">
              {att.records.slice(0, 6).map((r, i) => (
                <View key={r._id} className={`flex-row items-center py-3 ${i ? "border-t border-gray-100" : ""}`}>
                  <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                    <Ionicons name="checkmark" size={18} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-ink">{dayLabel(r.date)}</Text>
                    <Text className="text-xs text-gray-500">{r.course ? r.course.name : "General check-in"}</Text>
                  </View>
                  <Text className="text-xs font-semibold text-gray-500">{formatTime(r.markedAt)}</Text>
                </View>
              ))}
            </Card>
          ) : att ? (
            <Card className="mt-3">
              <Text className="text-sm text-gray-500">No check-ins yet. Your teacher scans your QR at class.</Text>
            </Card>
          ) : null}

          <SectionTitle title="Profile" />
          <Card className="py-1">
            <InfoRow icon="person-outline" label="Full name" value={user.fullName} />
            <InfoRow icon="id-card-outline" label="Student ID" value={user.studentId} />
            <InfoRow icon="mail-outline" label="Email" value={user.email} />
            <InfoRow icon="call-outline" label="Phone" value={user.phone} />
            <InfoRow icon="calendar-outline" label="Batch" value={user.batch} />
            <InfoRow icon="business-outline" label="Stream / School" value={user.department} />
          </Card>
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Button variant="outline" icon="create-outline" title="Edit" onPress={() => setEditing(true)} />
            </View>
            <View className="flex-1">
              <Button variant="outline" icon="key-outline" title="Password" onPress={() => setChangingPw(true)} />
            </View>
          </View>
          <Button className="mt-3" variant="dark" icon="log-out-outline" title="Sign out" onPress={() => setShowLogoutModal(true)} />
        </ScrollView>
      </Sheet>
      <ConfirmModal
        visible={showLogoutModal}
        title="Sign out?"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
        }}
      />
      <FormModal
        visible={editing}
        title="Edit profile"
        fields={[
          { key: "fullName", label: "Full name" },
          { key: "phone", label: "Phone", keyboardType: "phone-pad" },
        ]}
        initial={user || {}}
        onClose={() => setEditing(false)}
        onSubmit={save}
      />
      <ChangePasswordModal
        visible={changingPw}
        onClose={() => setChangingPw(false)}
        onDone={(u) => {
          updateUser(u);
          setChangingPw(false);
          Alert.alert("Password updated", "Use your new password next time you sign in.");
        }}
      />
    </View>
  );
}

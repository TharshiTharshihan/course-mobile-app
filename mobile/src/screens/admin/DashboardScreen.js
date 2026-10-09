import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Card, ConfirmModal, Empty, Hero, Sheet } from "../../components/ui";
import { errMsg } from "../../utils";

function Stat({ icon, label, value }) {
  return (
    <View className="flex-1 rounded-3xl bg-white p-4 shadow-sm">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-brand">
        <Ionicons name={icon} size={20} color="#0B0B0F" />
      </View>
      <Text className="text-3xl font-extrabold text-ink">{value}</Text>
      <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</Text>
    </View>
  );
}

function Action({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center rounded-3xl bg-ink px-2 py-4 active:opacity-80">
      <Ionicons name={icon} size={26} color="#FFC400" />
      <Text className="mt-2 text-sm font-bold text-white">{label}</Text>
    </Pressable>
  );
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [stats, setStats] = useState({ students: 0, courses: 0, materials: 0 });
  const [recent, setRecent] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [s, l] = await Promise.all([api.get("/students/stats"), api.get("/students")]);
          setStats(s.data);
          setRecent(l.data.slice(0, 5));
        } catch (e) {
          Alert.alert("Error", errMsg(e));
        }
      })();
    }, [])
  );

  return (
    <View className="flex-1 bg-surface ">
      <Hero
        title="Admin Panel"
        subtitle="Overview of students and course content"
        titleStyle={{ fontFamily: "Poppins_700Bold" }}
        right={
          <Pressable
            onPress={() => setShowLogoutModal(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </Pressable>
        }
      />
      <Sheet>
        <ScrollView className="px-5 pt-6" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row gap-3">
            <Stat icon="people" label="Students" value={stats.students} />
            <Stat icon="book" label="Courses" value={stats.courses} />
            <Stat icon="document-text" label="Files" value={stats.materials} />
          </View>

          <View className="mt-4 flex-row gap-3">
            <Action icon="scan" label="Scan QR" onPress={() => navigation.navigate("Scan")} />
            <Action icon="people" label="Students" onPress={() => navigation.navigate("Students")} />
            <Action icon="book" label="Courses" onPress={() => navigation.navigate("Courses")} />
          </View>

          <Text className="mb-3 mt-8 text-sm font-extrabold uppercase tracking-widest text-gray-400">Recent sign-ups</Text>
          {recent.length === 0 ? (
            <Empty icon="people-outline" title="No students yet" text="New registrations will show up here." />
          ) : (
            recent.map((s) => (
              <Card key={s._id} className="mb-3" onPress={() => navigation.navigate("StudentDetail", { id: s._id })}>
                <View className="flex-row items-center">
                  <Avatar name={s.fullName} />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-ink">{s.fullName}</Text>
                    <Text className="text-sm text-gray-500">{s.studentId}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </Sheet>
      <ConfirmModal
        visible={showLogoutModal}
        title="Sign out?"
        message="Are you sure you want to sign out of the admin panel?"
        confirmLabel="Sign out"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
        }}
      />
    </View>
  );
}

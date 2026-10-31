import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Banner, Card, Empty, GreetingHero, HeaderButton, Loader, SectionTitle, Sheet, StatCard } from "../../components/ui";
import { NOTICE_TYPES, errMsg, timeAgo, alertError } from "../../utils";

function Action({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center rounded-3xl bg-ink px-1 py-4 active:opacity-80">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand">
        <Ionicons name={icon} size={22} color="#0B0B0F" />
      </View>
      <Text className="mt-2 text-xs font-bold text-white" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, courses: 0, materials: 0, presentToday: 0 });
  const [recent, setRecent] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, l, n] = await Promise.all([api.get("/students/stats"), api.get("/students"), api.get("/announcements")]);
      setStats(s.data);
      setRecent(l.data.slice(0, 4));
      setNotices(n.data.slice(0, 2));
    } catch (e) {
      alertError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const pct = stats.students ? Math.round((stats.presentToday / stats.students) * 100) : 0;

  return (
    <View className="flex-1 bg-surface">
      <GreetingHero
        name={user?.fullName}
        subtitle="Here's your class today"
        right={<HeaderButton icon="person-circle-outline" badge={user?.mustChangePassword} onPress={() => navigation.navigate("AdminProfile")} />}
      />
      <Sheet>
        <ScrollView
          className="px-5 pt-6"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        >
          {user?.mustChangePassword ? (
            <Banner
              icon="shield-half"
              title="Secure your account"
              text="You're signed in with the setup password. Set your own password now."
              action="Change password"
              onAction={() => navigation.navigate("AdminProfile", { changePassword: true })}
            />
          ) : null}

          {/* Today's attendance */}
          <Pressable onPress={() => navigation.navigate("Attendance")} className="rounded-3xl bg-ink p-5 active:opacity-90">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-widest text-white/50">Present today</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFC400" />
            </View>
            <View className="mt-2 flex-row items-end">
              <Text className="text-5xl text-white" style={{ fontFamily: "Poppins_700Bold" }}>
                {loading ? "–" : stats.presentToday}
              </Text>
              <Text className="mb-2 ml-2 text-base font-semibold text-white/50">of {stats.students} students</Text>
            </View>
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <View className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </View>
          </Pressable>

          <View className="mt-3 flex-row gap-3">
            <StatCard icon="people" label="Students" value={stats.students} loading={loading} onPress={() => navigation.navigate("Students")} />
            <StatCard icon="book" label="Classes" value={stats.courses} loading={loading} tint="#BFE3FF" onPress={() => navigation.navigate("Courses")} />
            <StatCard icon="document-text" label="Files" value={stats.materials} loading={loading} tint="#C9F2D0" />
          </View>

          <SectionTitle title="Quick actions" />
          <View className="flex-row gap-2.5">
            <Action icon="scan" label="Scan" onPress={() => navigation.navigate("Scan")} />
            <Action icon="megaphone" label="Notice" onPress={() => navigation.navigate("Notices")} />
            <Action icon="people" label="Students" onPress={() => navigation.navigate("Students")} />
            <Action icon="cloud-upload" label="Notes" onPress={() => navigation.navigate("Courses")} />
          </View>

          <SectionTitle title="Latest notices" action="See all" onAction={() => navigation.navigate("Notices")} />
          {loading ? (
            <Loader />
          ) : notices.length === 0 ? (
            <Card>
              <Text className="text-sm text-gray-500">No notices yet. Send a reminder or announcement from the Notices tab.</Text>
            </Card>
          ) : (
            notices.map((n) => {
              const t = NOTICE_TYPES[n.type] || NOTICE_TYPES.announcement;
              return (
                <Card key={n._id} className="mb-3" onPress={() => navigation.navigate("Notices")}>
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.bg }}>
                      <Ionicons name={t.icon} size={18} color={t.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-ink" numberOfLines={1}>
                        {n.title}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {t.label} · {n.course ? n.course.code : "Everyone"} · {timeAgo(n.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}

          <SectionTitle title="Recent sign-ups" action="All students" onAction={() => navigation.navigate("Students")} />
          {loading ? null : recent.length === 0 ? (
            <Empty icon="people-outline" title="No students yet" text="New registrations will show up here." />
          ) : (
            recent.map((s) => (
              <Card key={s._id} className="mb-3" onPress={() => navigation.navigate("StudentDetail", { id: s._id })}>
                <View className="flex-row items-center">
                  <Avatar name={s.fullName} size={44} />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-ink">{s.fullName}</Text>
                    <Text className="text-sm text-gray-500">
                      {s.studentId} · {timeAgo(s.createdAt)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      </Sheet>
    </View>
  );
}

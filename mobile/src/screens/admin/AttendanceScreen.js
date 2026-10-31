import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";
import { Avatar, Card, ChipRow, ConfirmModal, Empty, Hero, Loader, Segmented, Sheet } from "../../components/ui";
import { dayKey, dayLabel, errMsg, formatTime, shiftDay, alertError } from "../../utils";

export default function AttendanceScreen({ navigation }) {
  const [date, setDate] = useState(dayKey());
  const [course, setCourse] = useState("all");
  const [courses, setCourses] = useState([]);
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState("present");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/attendance", { params: { date, course } });
      setReport(data);
    } catch (e) {
      alertError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, course]);

  useFocusEffect(
    useCallback(() => {
      api.get("/courses").then(({ data }) => setCourses(data)).catch(() => {});
      load();
    }, [load])
  );

  useEffect(() => {
    setLoading(true);
  }, [date, course]);

  const remove = async () => {
    const rec = removing;
    setRemoving(null);
    try {
      await api.delete(`/attendance/${rec._id}`);
      load();
    } catch (e) {
      alertError(e);
    }
  };

  const isToday = date === dayKey();
  const present = report?.present || [];
  const absent = report?.absent || [];
  const total = report?.total || 0;
  const presentCount = new Set(present.map((p) => p.student._id)).size;
  const pct = total ? Math.round((presentCount / total) * 100) : 0;

  const header = (
    <View>
      <Card className="mb-4">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">Present</Text>
            <Text className="text-4xl text-ink" style={{ fontFamily: "Poppins_700Bold" }}>
              {presentCount}
              <Text className="text-lg text-gray-400"> / {total}</Text>
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-extrabold text-ink">{pct}%</Text>
            <Text className="text-xs font-semibold text-gray-400">{absent.length} absent</Text>
          </View>
        </View>
        <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100">
          <View className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </View>
      </Card>
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: "present", label: `Present (${presentCount})` },
          { value: "absent", label: `Absent (${absent.length})` },
        ]}
      />
    </View>
  );

  const data = loading ? [] : tab === "present" ? present : absent;

  return (
    <View className="flex-1 bg-surface">
      <Hero title="Attendance" titleStyle={{ fontFamily: "Poppins_700Bold" }} subtitle="Daily register from QR check-ins">
        <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-white/10 p-1.5">
          <Pressable onPress={() => setDate((d) => shiftDay(d, -1))} className="h-10 w-10 items-center justify-center rounded-xl active:bg-white/10">
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setDate(dayKey())} className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#FFC400" />
            <Text className="ml-2 text-base font-bold text-white">{dayLabel(date)}</Text>
          </Pressable>
          <Pressable
            disabled={isToday}
            onPress={() => setDate((d) => shiftDay(d, 1))}
            className={`h-10 w-10 items-center justify-center rounded-xl active:bg-white/10 ${isToday ? "opacity-30" : ""}`}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        </View>
        <ChipRow
          dark
          className="mt-3"
          value={course}
          onChange={setCourse}
          options={[
            { value: "all", label: "All classes" },
            { value: "general", label: "General" },
            ...courses.map((c) => ({ value: c._id, label: c.code })),
          ]}
        />
      </Hero>
      <Sheet>
        <FlatList
          data={data}
          keyExtractor={(i) => i._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListHeaderComponent={header}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : tab === "present" ? (
              <Empty
                icon="scan-outline"
                title="No check-ins"
                text={isToday ? "Scan student QR codes from the Scan tab to mark them present." : "Nobody was marked present on this day."}
              />
            ) : (
              <Empty icon="happy-outline" title="Everyone is here" text="All registered students were marked present." />
            )
          }
          renderItem={({ item }) => {
            const s = tab === "present" ? item.student : item;
            return (
              <Card
                className="mb-3"
                onPress={() => navigation.navigate("StudentDetail", { id: s._id })}
              >
                <View className="flex-row items-center">
                  <Avatar name={s.fullName} size={44} />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-ink" numberOfLines={1}>
                      {s.fullName}
                    </Text>
                    <Text className="text-sm text-gray-500" numberOfLines={1}>
                      {s.studentId}
                      {tab === "present" ? ` · ${item.course ? item.course.code : "General"}` : s.batch ? ` · ${s.batch}` : ""}
                    </Text>
                  </View>
                  {tab === "present" ? (
                    <View className="flex-row items-center">
                      <View className="mr-2 rounded-full bg-emerald-50 px-2.5 py-1">
                        <Text className="text-xs font-bold text-emerald-700">{formatTime(item.markedAt)}</Text>
                      </View>
                      <Pressable onPress={() => setRemoving(item)} hitSlop={8} className="p-1">
                        <Ionicons name="close-circle-outline" size={22} color="#9CA3AF" />
                      </Pressable>
                    </View>
                  ) : (
                    <View className="rounded-full bg-red-50 px-2.5 py-1">
                      <Text className="text-xs font-bold text-red-600">Absent</Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          }}
        />
      </Sheet>

      <ConfirmModal
        visible={!!removing}
        title="Remove check-in?"
        message={removing ? `${removing.student.fullName} will be marked absent for ${dayLabel(date).toLowerCase()}.` : ""}
        confirmLabel="Remove"
        onCancel={() => setRemoving(null)}
        onConfirm={remove}
      />
    </View>
  );
}

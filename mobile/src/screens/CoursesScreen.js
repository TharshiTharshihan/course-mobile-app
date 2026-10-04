import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Card, Empty, FormModal, Hero, Input, Loader, Sheet } from "../components/ui";
import { colorFor, errMsg } from "../utils";

const FIELDS = [
  { key: "name", label: "Course name", placeholder: "Data Structures & Algorithms" },
  { key: "code", label: "Course code", placeholder: "CE2012", autoCapitalize: "characters" },
  { key: "description", label: "Description (optional)", placeholder: "Short summary", multiline: true },
];

export default function CoursesScreen({ navigation }) {
  const { user, isAdmin } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null); // null | {} (new) | course (edit)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/courses");
      setCourses(data);
    } catch (e) {
      Alert.alert("Error", errMsg(e));
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

  const save = async (values) => {
    try {
      if (modal?._id) await api.put(`/courses/${modal._id}`, values);
      else await api.post("/courses", values);
      setModal(null);
      load();
    } catch (e) {
      Alert.alert("Could not save", errMsg(e));
    }
  };

  const remove = (c) =>
    Alert.alert("Delete course?", `"${c.name}" and all its files will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/courses/${c._id}`);
            load();
          } catch (e) {
            Alert.alert("Error", errMsg(e));
          }
        },
      },
    ]);

  const shown = courses.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <View className="flex-1 bg-surface">
      <Hero
        title={isAdmin ? "Manage courses" : "My courses"}
        subtitle={isAdmin ? "Add, edit and upload notes" : `Hi ${user?.fullName?.split(" ")[0] || ""}, pick a course to open notes`}
      />
      <Sheet>
        <FlatList
          data={shown}
          keyExtractor={(c) => c._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListHeaderComponent={
            <Input icon="search-outline" placeholder="Search by name or code" value={q} onChangeText={setQ} />
          }
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <Empty icon="book-outline" title="No courses yet" text={isAdmin ? "Tap + to add the first course." : "Your admin has not added courses yet."} />
            )
          }
          renderItem={({ item }) => (
            <Card className="mb-3" onPress={() => navigation.navigate("Course", { course: item })}>
              <View className="flex-row items-center">
                <View
                  className="mr-4 h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: colorFor(item.code) }}
                >
                  <Ionicons name="book" size={26} color="#0B0B0F" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-extrabold tracking-widest text-gray-400">{item.code}</Text>
                  <Text className="text-lg font-bold text-ink" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-500">
                    {item.materialCount} {item.materialCount === 1 ? "file" : "files"}
                  </Text>
                </View>
                {isAdmin ? (
                  <View className="items-center">
                    <Pressable onPress={() => setModal(item)} hitSlop={8} className="p-1.5">
                      <Ionicons name="create-outline" size={20} color="#0B0B0F" />
                    </Pressable>
                    <Pressable onPress={() => remove(item)} hitSlop={8} className="p-1.5">
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                )}
              </View>
            </Card>
          )}
        />
      </Sheet>

      {isAdmin ? (
        <Pressable
          onPress={() => setModal({})}
          className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg active:opacity-80"
        >
          <Ionicons name="add" size={32} color="#0B0B0F" />
        </Pressable>
      ) : null}

      <FormModal
        visible={!!modal}
        title={modal?._id ? "Edit course" : "New course"}
        fields={FIELDS}
        initial={modal || {}}
        onClose={() => setModal(null)}
        onSubmit={save}
      />
    </View>
  );
}

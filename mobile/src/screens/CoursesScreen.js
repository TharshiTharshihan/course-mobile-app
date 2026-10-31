import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Card, ConfirmModal, Empty, Fab, FormModal, GreetingHero, HeaderButton, Hero, Input, Loader, Sheet } from "../components/ui";
import { colorFor, errMsg, alertError } from "../utils";

const FIELDS = [
  { key: "name", label: "Class name", placeholder: "2027 A/L Physics - Theory" },
  { key: "code", label: "Short code", placeholder: "PHY27", autoCapitalize: "characters" },
  { key: "description", label: "Description (optional)", placeholder: "Short summary", multiline: true },
];

export default function CoursesScreen({ navigation }) {
  const { user, isAdmin, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null); // null | {} (new) | course (edit)
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/courses");
      setCourses(data);
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
    Alert.alert("Delete class?", `"${c.name}" with its files, notices and attendance records will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/courses/${c._id}`);
            load();
          } catch (e) {
            alertError(e);
          }
        },
      },
    ]);

  const shown = courses.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())
  );

  const headerButton = isAdmin ? (
    <HeaderButton icon="person-circle-outline" badge={user?.mustChangePassword} onPress={() => navigation.navigate("AdminProfile")} />
  ) : (
    <HeaderButton icon="log-out-outline" onPress={() => setShowLogoutModal(true)} />
  );

  return (
    <View className="flex-1 bg-surface">
      {isAdmin ? (
        <Hero title="Classes" titleStyle={{ fontFamily: "Poppins_700Bold" }} subtitle="Create classes and share notes & PDFs" right={headerButton} />
      ) : (
        <GreetingHero name={user?.fullName} subtitle="Pick a class to open its notes" right={headerButton} />
      )}
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
            <Input icon="search-outline" placeholder="Search classes" value={q} onChangeText={setQ} />
          }
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <Empty icon="book-outline" title="No classes yet" text={isAdmin ? "Tap + to add your first class." : "Your teacher has not added classes yet."} />
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

      <ConfirmModal
        visible={showLogoutModal}
        title="Sign out?"
        message={isAdmin ? "Are you sure you want to sign out of the admin panel?" : "Are you sure you want to sign out?"}
        confirmLabel="Sign out"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
        }}
      />

      {isAdmin ? <Fab onPress={() => setModal({})} /> : null}

      <FormModal
        visible={!!modal}
        title={modal?._id ? "Edit class" : "New class"}
        fields={FIELDS}
        initial={modal || {}}
        onClose={() => setModal(null)}
        onSubmit={save}
      />
    </View>
  );
}

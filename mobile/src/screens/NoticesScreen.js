import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView, Switch } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, ChipRow, ConfirmModal, Empty, Fab, Hero, Input, Loader, Sheet } from "../components/ui";
import { NOTICE_TYPES, errMsg, timeAgo, alertError } from "../utils";

const SEEN_KEY = "notices_seen_at";

/** Notices feed. Admin: post / edit / delete. Students: read, with "New" on unseen items. */
export default function NoticesScreen() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null); // null | {} new | notice
  const [seenAt, setSeenAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const [{ data }, c] = await Promise.all([api.get("/announcements"), api.get("/courses").catch(() => ({ data: [] }))]);
      setList(data);
      setCourses(c.data);
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
      if (isAdmin) return;
      // Remember when the student last opened this tab, so newer notices get a "New" tag.
      SecureStore.getItemAsync(SEEN_KEY)
        .then((v) => setSeenAt(v ? Number(v) : 0))
        .catch(() => setSeenAt(0));
      return () => {
        SecureStore.setItemAsync(SEEN_KEY, String(Date.now())).catch(() => {});
      };
    }, [load, isAdmin])
  );

  const shown = list.filter((n) => filter === "all" || n.type === filter);

  return (
    <View className="flex-1 bg-surface">
      <Hero
        title={isAdmin ? "Notices" : "Updates"}
        titleStyle={{ fontFamily: "Poppins_700Bold" }}
        subtitle={isAdmin ? "Announcements, class reminders and what to bring" : "Messages from your teacher"}
      >
        <ChipRow
          dark
          className="mt-5"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            ...Object.entries(NOTICE_TYPES).map(([value, t]) => ({ value, label: t.label, icon: t.icon })),
          ]}
        />
      </Hero>
      <Sheet>
        <FlatList
          data={shown}
          keyExtractor={(n) => n._id}
          contentContainerStyle={{ padding: 20, paddingBottom: isAdmin ? 110 : 40 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <Empty
                icon="notifications-off-outline"
                title="Nothing here yet"
                text={isAdmin ? "Tap + to send your first announcement or reminder." : "Your teacher's announcements and reminders will show up here."}
              />
            )
          }
          renderItem={({ item }) => {
            const t = NOTICE_TYPES[item.type] || NOTICE_TYPES.announcement;
            const isNew = !isAdmin && seenAt !== null && new Date(item.createdAt).getTime() > seenAt;
            return (
              <Card className="mb-3" onPress={isAdmin ? () => setEditing(item) : undefined}>
                <View className="flex-row">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: t.bg }}>
                    <Ionicons name={t.icon} size={20} color={t.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row flex-wrap items-center gap-1.5">
                      <Badge label={t.label} color={t.color} bg={t.bg} />
                      {item.course ? <Badge label={item.course.code} /> : <Badge label="Everyone" />}
                      {isNew ? <Badge label="New" color="#0B0B0F" bg="#FFC400" /> : null}
                    </View>
                    <Text className="mt-2 text-base font-extrabold text-ink">{item.title}</Text>
                    {item.message ? <Text className="mt-1 text-sm leading-5 text-gray-600">{item.message}</Text> : null}
                    <View className="mt-2 flex-row items-center">
                      {item.pinned ? (
                        <>
                          <Ionicons name="pin" size={12} color="#E0A800" />
                          <Text className="ml-1 mr-2 text-xs font-bold text-brand-dark">Pinned</Text>
                        </>
                      ) : null}
                      <Text className="text-xs text-gray-400">{timeAgo(item.createdAt)}</Text>
                    </View>
                  </View>
                  {isAdmin ? <Ionicons name="create-outline" size={18} color="#9CA3AF" /> : null}
                </View>
              </Card>
            );
          }}
        />
      </Sheet>

      {isAdmin ? <Fab icon="add" onPress={() => setEditing({})} /> : null}

      {isAdmin ? (
        <NoticeEditor
          notice={editing}
          courses={courses}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
    </View>
  );
}

const TEMPLATES = {
  announcement: { title: "", message: "" },
  reminder: { title: "Class reminder", message: "Class starts at 4:00 PM today. Please be on time." },
  bring: { title: "Please bring", message: "Bring your past papers and a calculator to the next class." },
};

function NoticeEditor({ notice, courses, onClose, onSaved }) {
  const visible = !!notice;
  const isEdit = !!notice?._id;
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setError("");
    setF(
      isEdit
        ? { type: notice.type, title: notice.title, message: notice.message, course: notice.course?._id || null, pinned: notice.pinned }
        : { type: "announcement", title: "", message: "", course: null, pinned: false }
    );
  }, [visible]);

  const pickType = (type) =>
    setF((p) => {
      // Fill in a helpful starting text when the fields are still empty or untouched templates.
      const tpl = TEMPLATES[type];
      const untouched = !p.title || Object.values(TEMPLATES).some((t) => t.title === p.title);
      return untouched && !isEdit ? { ...p, type, title: tpl.title, message: tpl.message } : { ...p, type };
    });

  const save = async () => {
    if (!f.title?.trim()) return setError("Add a title");
    try {
      setBusy(true);
      if (isEdit) await api.put(`/announcements/${notice._id}`, f);
      else await api.post("/announcements", f);
      onSaved();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      await api.delete(`/announcements/${notice._id}`);
      onSaved();
    } catch (e) {
      alertError(e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/50">
        <View className="max-h-[92%] rounded-t-[28px] bg-surface">
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-extrabold text-ink">{isEdit ? "Edit notice" : "New notice"}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={26} color="#0B0B0F" />
              </Pressable>
            </View>

            <Text className="mb-2 text-sm font-semibold text-gray-700">Type</Text>
            <ChipRow
              className="mb-4"
              value={f.type}
              onChange={pickType}
              options={Object.entries(NOTICE_TYPES).map(([value, t]) => ({ value, label: t.label, icon: t.icon }))}
            />

            <Text className="mb-2 text-sm font-semibold text-gray-700">Send to</Text>
            <ChipRow
              className="mb-4"
              value={f.course || "all"}
              onChange={(v) => setF((p) => ({ ...p, course: v === "all" ? null : v }))}
              options={[{ value: "all", label: "Everyone", icon: "people" }, ...courses.map((c) => ({ value: c._id, label: c.code }))]}
            />

            {error ? (
              <View className="mb-4 flex-row items-center rounded-2xl bg-red-50 p-3">
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text className="ml-2 flex-1 text-sm font-semibold text-red-600">{error}</Text>
              </View>
            ) : null}

            <Input
              label="Title"
              icon="text-outline"
              placeholder="e.g. No class this Saturday"
              value={f.title || ""}
              onChangeText={(t) => {
                setF((p) => ({ ...p, title: t }));
                setError("");
              }}
              maxLength={120}
            />
            <Input
              label="Message"
              placeholder="Details students should know"
              value={f.message || ""}
              onChangeText={(t) => setF((p) => ({ ...p, message: t }))}
              multiline
              maxLength={2000}
            />

            <View className="mb-5 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
              <View className="flex-1 pr-3">
                <Text className="text-base font-bold text-ink">Pin to top</Text>
                <Text className="text-xs text-gray-500">Keep it above newer notices</Text>
              </View>
              <Switch
                value={!!f.pinned}
                onValueChange={(v) => setF((p) => ({ ...p, pinned: v }))}
                trackColor={{ true: "#FFC400", false: "#D1D5DB" }}
                thumbColor="#fff"
              />
            </View>

            <Button title={isEdit ? "Save changes" : "Send to students"} icon={isEdit ? "checkmark" : "send"} onPress={save} loading={busy} />
            {isEdit ? (
              <Button className="mt-3" variant="outline" icon="trash-outline" title="Delete" titleClassName="text-red-500" onPress={() => setConfirmDelete(true)} />
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirmDelete}
        title="Delete notice?"
        message="Students will no longer see it."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </Modal>
  );
}

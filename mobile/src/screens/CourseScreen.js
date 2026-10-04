import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, Alert, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import api, { fileUrl, getAuthToken } from "../api";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Empty, FormModal, Hero, Loader, Sheet } from "../components/ui";
import { errMsg, formatDate, formatSize } from "../utils";

const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

export default function CourseScreen({ route, navigation }) {
  const { course } = route.params;
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [renaming, setRenaming] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/courses/${course._id}/materials`);
      setItems(data);
    } catch (e) {
      Alert.alert("Error", errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [course._id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const upload = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: DOC_TYPES, copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;

    const file = res.assets[0];
    try {
      setUploading(true);

      const token = getAuthToken();
      const form = new FormData();
      form.append("title", file.name.replace(/\.[^/.]+$/, ""));
      form.append(
        "file",
        file.file || {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/pdf",
        }
      );

      const response = await fetch(`${api.defaults.baseURL}/courses/${course._id}/materials`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || `Upload failed (${response.status})`);
      }

      load();
    } catch (e) {
      Alert.alert("Upload failed", errMsg(e));
    } finally {
      setUploading(false);
    }
  };

  const rename = async ({ title }) => {
    if (!title?.trim()) return Alert.alert("Title required");
    try {
      await api.put(`/materials/${renaming._id}`, { title });
      setRenaming(null);
      load();
    } catch (e) {
      Alert.alert("Error", errMsg(e));
    }
  };

  const remove = (m) =>
    Alert.alert("Delete file?", `"${m.title}" will be removed for all students.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/materials/${m._id}`);
            load();
          } catch (e) {
            Alert.alert("Error", errMsg(e));
          }
        },
      },
    ]);

  const open = (m) => Linking.openURL(fileUrl(m.fileName)).catch(() => Alert.alert("Cannot open file"));

  return (
    <View className="flex-1 bg-surface">
      <Hero title={course.name} subtitle={course.code} onBack={() => navigation.goBack()} />
      <Sheet>
        <FlatList
          data={items}
          keyExtractor={(m) => m._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          ListHeaderComponent={
            <View>
              {course.description ? <Text className="mb-4 text-base text-gray-600">{course.description}</Text> : null}
              {isAdmin ? (
                <Button className="mb-4" icon="cloud-upload-outline" title="Upload PDF / notes" onPress={upload} loading={uploading} />
              ) : null}
              <Text className="mb-3 text-sm font-extrabold uppercase tracking-widest text-gray-400">
                Notes & files ({items.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            loading ? <Loader /> : <Empty icon="document-outline" title="No files yet" text={isAdmin ? "Upload the first PDF above." : "Notes will appear here once uploaded."} />
          }
          renderItem={({ item }) => (
            <Card className="mb-3" onPress={() => open(item)}>
              <View className="flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                  <Ionicons name="document-text" size={24} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-ink" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {formatSize(item.size)} · {formatDate(item.createdAt)}
                  </Text>
                </View>
                {isAdmin ? (
                  <View className="flex-row">
                    <Pressable onPress={() => setRenaming(item)} hitSlop={8} className="p-2">
                      <Ionicons name="create-outline" size={20} color="#0B0B0F" />
                    </Pressable>
                    <Pressable onPress={() => remove(item)} hitSlop={8} className="p-2">
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ) : (
                  <Ionicons name="open-outline" size={20} color="#9CA3AF" />
                )}
              </View>
            </Card>
          )}
        />
      </Sheet>

      <FormModal
        visible={!!renaming}
        title="Rename file"
        fields={[{ key: "title", label: "Title", placeholder: "Week 3 notes" }]}
        initial={{ title: renaming?.title || "" }}
        onClose={() => setRenaming(null)}
        onSubmit={rename}
      />
    </View>
  );
}

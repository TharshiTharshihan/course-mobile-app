import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";
import { Avatar, Card, Empty, Hero, Input, Loader, Sheet } from "../../components/ui";
import { errMsg } from "../../utils";

export default function StudentsScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const qRef = useRef("");

  const load = useCallback(async (query = qRef.current) => {
    try {
      const { data } = await api.get("/students", { params: { q: query } });
      setList(data);
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

  // debounce search
  useEffect(() => {
    qRef.current = q;
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <View className="flex-1 bg-surface">
      <Hero title="Students" subtitle={`${list.length} registered`} titleStyle={{ fontFamily: "Poppins_700Bold" }} />
      <Sheet>
        <FlatList
          data={list}
          keyExtractor={(s) => s._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Input icon="search-outline" placeholder="Search name, ID or email" value={q} onChangeText={setQ} autoCapitalize="none" />
          }
          ListEmptyComponent={loading ? <Loader /> : <Empty icon="people-outline" title="No students found" />}
          renderItem={({ item }) => (
            <Card className="mb-3" onPress={() => navigation.navigate("StudentDetail", { id: item._id })}>
              <View className="flex-row items-center">
                <Avatar name={item.fullName} />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-ink" numberOfLines={1}>
                    {item.fullName}
                  </Text>
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {item.studentId}
                    {item.department ? ` · ${item.department}` : ""}
                  </Text>
                </View>
                <Ionicons name="qr-code-outline" size={22} color="#0B0B0F" />
              </View>
            </Card>
          )}
        />
      </Sheet>
    </View>
  );
}

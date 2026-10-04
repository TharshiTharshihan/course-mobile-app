import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../api";
import { Button, Card, FormModal, Hero, InfoRow, Loader, Sheet } from "../../components/ui";
import StudentQR from "../../components/StudentQR";
import { errMsg, formatDate } from "../../utils";

const FIELDS = [
  { key: "fullName", label: "Full name" },
  { key: "phone", label: "Phone", keyboardType: "phone-pad" },
  { key: "department", label: "Department" },
  { key: "batch", label: "Batch / Year" },
];

export default function StudentDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [student, setStudent] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/students/${id}`);
        setStudent(data);
      } catch (e) {
        Alert.alert("Error", errMsg(e), [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    })();
  }, [id]);

  const save = async (values) => {
    try {
      const { data } = await api.put(`/students/${student._id}`, values);
      setStudent(data);
      setEditing(false);
    } catch (e) {
      Alert.alert("Could not save", errMsg(e));
    }
  };

  const remove = () =>
    Alert.alert("Delete student?", `${student.fullName} will be removed permanently.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/students/${student._id}`);
            navigation.goBack();
          } catch (e) {
            Alert.alert("Error", errMsg(e));
          }
        },
      },
    ]);

  return (
    <View className="flex-1 bg-surface">
      <Hero
        title={student?.fullName || "Student"}
        subtitle={student?.studentId}
        onBack={() => navigation.goBack()}
      />
      <Sheet>
        {!student ? (
          <Loader />
        ) : (
          <ScrollView className="px-5 pt-6" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
            <StudentQR student={student} />
            <Card className="mt-5">
              <InfoRow icon="person-outline" label="Full name" value={student.fullName} />
              <InfoRow icon="id-card-outline" label="Student ID" value={student.studentId} />
              <InfoRow icon="mail-outline" label="Email" value={student.email} />
              <InfoRow icon="call-outline" label="Phone" value={student.phone} />
              <InfoRow icon="business-outline" label="Department" value={student.department} />
              <InfoRow icon="calendar-outline" label="Batch" value={student.batch} />
              <InfoRow icon="time-outline" label="Registered" value={formatDate(student.createdAt)} />
            </Card>
            <View className="mt-5 flex-row gap-3">
              <View className="flex-1">
                <Button variant="outline" icon="create-outline" title="Edit" onPress={() => setEditing(true)} />
              </View>
              <View className="flex-1">
                <Button variant="danger" icon="trash-outline" title="Delete" onPress={remove} />
              </View>
            </View>
          </ScrollView>
        )}
      </Sheet>

      <FormModal
        visible={editing}
        title="Edit student"
        fields={FIELDS}
        initial={student || {}}
        onClose={() => setEditing(false)}
        onSubmit={save}
      />
    </View>
  );
}

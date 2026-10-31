import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../api";
import { Button, Card, ConfirmModal, FormModal, Hero, InfoRow, Loader, Sheet, StatCard } from "../../components/ui";
import StudentQR from "../../components/StudentQR";
import { errMsg, formatDate, timeAgo, alertError } from "../../utils";

const FIELDS = [
  { key: "batch", label: "Batch / Year", placeholder: "2027 A/L" },
  { key: "department", label: "Stream / School", placeholder: "Physical Science" },
];

export default function StudentDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [student, setStudent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/students/${id}`);
        setStudent(data);
      } catch (e) {
        (e.sessionExpired ? null : Alert.alert("Error", errMsg(e), [{ text: "OK", onPress: () => navigation.goBack() }]));
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

  const resetQr = async () => {
    setConfirmReset(false);
    try {
      const { data } = await api.post(`/students/${student._id}/reset-qr`);
      setStudent((s) => ({ ...s, ...data }));
      Alert.alert("New QR issued", "The old QR code no longer works. Share the new one with the student.");
    } catch (e) {
      alertError(e);
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
            alertError(e);
          }
        },
      },
    ]);

  return (
    <View className="flex-1 bg-surface">
      <Hero
        title={student?.fullName || "Student"}
        titleStyle={{ fontFamily: "Poppins_700Bold" }}
        subtitle={student?.studentId}
        onBack={() => navigation.goBack()}
      />
      <Sheet>
        {!student ? (
          <Loader />
        ) : (
          <ScrollView className="px-5 pt-6" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
            <View className="mb-4 flex-row gap-3">
              <StatCard icon="checkmark-done" label="Days present" value={student.attendance?.days ?? 0} tint="#C9F2D0" />
              <StatCard
                icon="time"
                label="Last check-in"
                value={student.attendance?.lastSeen ? timeAgo(student.attendance.lastSeen) : "Never"}
                tint="#BFE3FF"
              />
            </View>
            <StudentQR student={student} />
            <Button className="mt-3" variant="outline" icon="refresh" title="Reset QR (lost or shared card)" onPress={() => setConfirmReset(true)} />
            <Card className="mt-5">
              <InfoRow icon="person-outline" label="Full name" value={student.fullName} />
              <InfoRow icon="id-card-outline" label="Student ID" value={student.studentId} />
              <InfoRow icon="mail-outline" label="Email" value={student.email} />
              <InfoRow icon="call-outline" label="Phone" value={student.phone} />
              <InfoRow icon="business-outline" label="Stream / School" value={student.department} />
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

      <ConfirmModal
        visible={confirmReset}
        title="Issue a new QR?"
        message="The current QR code stops working immediately. Use this if the card was lost or shared."
        confirmLabel="Reset QR"
        onCancel={() => setConfirmReset(false)}
        onConfirm={resetQr}
      />

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

import React from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, ConfirmModal, Hero, InfoRow, Sheet } from "../../components/ui";
import StudentQR from "../../components/StudentQR";
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  return (
    <View className="flex-1 bg-surface">
      <Hero title="My QR" subtitle="Show this code to be identified" />
      <Sheet>
        <ScrollView className="px-5 pt-6" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <StudentQR student={user} />
          <Card className="mt-5">
            <InfoRow icon="person-outline" label="Full name" value={user.fullName} />
            <InfoRow icon="id-card-outline" label="Student ID" value={user.studentId} />
            <InfoRow icon="mail-outline" label="Email" value={user.email} />
            <InfoRow icon="call-outline" label="Phone" value={user.phone} />
            <InfoRow icon="business-outline" label="Department" value={user.department} />
            <InfoRow icon="calendar-outline" label="Batch" value={user.batch} />
          </Card>
          <Button
            className="mt-5"
            variant="outline"
            icon="log-out-outline"
            title="Sign out"
            onPress={() => setShowLogoutModal(true)}
          />
        </ScrollView>
      </Sheet>
      <ConfirmModal
        visible={showLogoutModal}
        title="Sign out?"
        message="Are you sure you want to sign out?"
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

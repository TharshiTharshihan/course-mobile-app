import React, { useState } from "react";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Banner, Card, ConfirmModal, FormModal, Hero, InfoRow, Sheet } from "../../components/ui";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { errMsg } from "../../utils";

function Row({ icon, label, hint, onPress, danger }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center border-b border-gray-100 py-4 active:opacity-70">
      <View className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${danger ? "bg-red-50" : "bg-brand-soft"}`}>
        <Ionicons name={icon} size={18} color={danger ? "#EF4444" : "#0B0B0F"} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${danger ? "text-red-500" : "text-ink"}`}>{label}</Text>
        {hint ? <Text className="text-xs text-gray-500">{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

export default function AdminProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [changingPw, setChangingPw] = useState(!!route.params?.changePassword);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const save = async (values) => {
    try {
      const { data } = await api.put("/auth/me", { fullName: values.fullName, email: values.email });
      updateUser(data);
      setEditing(false);
    } catch (e) {
      Alert.alert("Could not save", errMsg(e));
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <Hero title="Account" titleStyle={{ fontFamily: "Poppins_700Bold" }} subtitle="Class owner profile and security" onBack={() => navigation.goBack()} />
      <Sheet>
        <ScrollView className="px-5 pt-6" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          {user?.mustChangePassword ? (
            <Banner
              icon="shield-half"
              title="Default password in use"
              text="Anyone who knows the setup password can sign in as you. Change it now."
              action="Change password"
              onAction={() => setChangingPw(true)}
            />
          ) : null}

          <Card className="items-center py-6">
            <Avatar name={user?.fullName} size={72} />
            <Text className="mt-3 text-xl text-ink" style={{ fontFamily: "Poppins_700Bold" }}>
              {user?.fullName}
            </Text>
            <Text className="text-sm text-gray-500">{user?.email}</Text>
            <View className="mt-3 flex-row items-center rounded-full bg-ink px-3 py-1">
              <Ionicons name="shield-checkmark" size={12} color="#FFC400" />
              <Text className="ml-1 text-[11px] font-extrabold uppercase tracking-wide text-white">Class owner</Text>
            </View>
          </Card>

          <Card className="mt-4 py-1">
            <InfoRow icon="person-outline" label="Name" value={user?.fullName} />
            <InfoRow icon="mail-outline" label="Sign-in email" value={user?.email} />
          </Card>

          <Card className="mt-4 py-0">
            <Row icon="create-outline" label="Edit profile" hint="Name and sign-in email" onPress={() => setEditing(true)} />
            <Row
              icon="key-outline"
              label="Change password"
              hint={user?.mustChangePassword ? "Still using the setup password" : "Update your sign-in password"}
              onPress={() => setChangingPw(true)}
            />
            <Row icon="log-out-outline" label="Sign out" danger onPress={() => setConfirmLogout(true)} />
          </Card>
        </ScrollView>
      </Sheet>

      <FormModal
        visible={editing}
        title="Edit profile"
        fields={[
          { key: "fullName", label: "Name", placeholder: "Mr. Perera" },
          { key: "email", label: "Sign-in email", autoCapitalize: "none", keyboardType: "email-address" },
        ]}
        initial={user || {}}
        onClose={() => setEditing(false)}
        onSubmit={save}
      />

      <ChangePasswordModal
        visible={changingPw}
        forced={user?.mustChangePassword}
        onClose={() => setChangingPw(false)}
        onDone={(u) => {
          updateUser(u);
          setChangingPw(false);
          Alert.alert("Password updated", "Use your new password next time you sign in.");
        }}
      />

      <ConfirmModal
        visible={confirmLogout}
        title="Sign out?"
        message="Are you sure you want to sign out of the admin panel?"
        confirmLabel="Sign out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setConfirmLogout(false);
          await logout();
        }}
      />
    </View>
  );
}

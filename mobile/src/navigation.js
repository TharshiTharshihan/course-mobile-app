import React, { useState } from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "./context/AuthContext";

import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/auth/LoginScreen";
import RegisterScreen from "./screens/auth/RegisterScreen";
import CoursesScreen from "./screens/CoursesScreen";
import CourseScreen from "./screens/CourseScreen";
import ProfileScreen from "./screens/student/ProfileScreen";
import DashboardScreen from "./screens/admin/DashboardScreen";
import StudentsScreen from "./screens/admin/StudentsScreen";
import StudentDetailScreen from "./screens/admin/StudentDetailScreen";
import ScanScreen from "./screens/admin/ScanScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONS = {
  Courses: ["book", "book-outline"],
  MyQR: ["qr-code", "qr-code-outline"],
  Dashboard: ["grid", "grid-outline"],
  Students: ["people", "people-outline"],
  Scan: ["scan", "scan-outline"],
};

// Bottom inset = height of Android's gesture/3-button bar (the app draws edge-to-edge),
// so the tab bar grows by it instead of letting the labels slide under it.
const tabOptions = (bottomInset) => ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: "#0B0B0F",
  tabBarInactiveTintColor: "#9CA3AF",
  tabBarLabelStyle: { fontWeight: "700", fontSize: 11, marginBottom: 2 },
  tabBarItemStyle: { flex: 1 },
  tabBarIconStyle: { height: 32, width: 56 },
  tabBarStyle: {
    backgroundColor: "#fff",
    borderTopWidth: 0,
    elevation: 14,
    height: 64 + bottomInset,
    paddingTop: 6,
    paddingBottom: bottomInset + 6,
  },
  tabBarIcon: ({ focused, color }) => (
    <View
      style={{
        width: 52,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "#FFC400" : "transparent",
        borderRadius: 14,
      }}
    >
      <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={22} color={color} />
    </View>
  ),
});

function StudentTabs() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={tabOptions(bottom)}>
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="MyQR" component={ProfileScreen} options={{ title: "My QR" }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={tabOptions(bottom)}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Students" component={StudentsScreen} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, booting, isAdmin } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <View className="flex-1 bg-ink">
      {booting ? null : <AppStack user={user} isAdmin={isAdmin} />}
      {splashDone ? null : <SplashScreen ready={!booting} onFinish={() => setSplashDone(true)} />}
    </View>
  );
}

function AppStack({ user, isAdmin }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={isAdmin ? AdminTabs : StudentTabs} />
          <Stack.Screen name="Course" component={CourseScreen} />
          {isAdmin ? <Stack.Screen name="StudentDetail" component={StudentDetailScreen} /> : null}
        </>
      )}
    </Stack.Navigator>
  );
}

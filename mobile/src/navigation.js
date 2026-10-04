import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./context/AuthContext";

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

const tabOptions = ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: "#0B0B0F",
  tabBarInactiveTintColor: "#9CA3AF",
  tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
  tabBarStyle: { backgroundColor: "#fff", borderTopWidth: 0, elevation: 14 },
  tabBarIcon: ({ focused, color }) => (
    <View
      style={{
        backgroundColor: focused ? "#FFC400" : "transparent",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 3,
      }}
    >
      <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={22} color={color} />
    </View>
  ),
});

function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="MyQR" component={ProfileScreen} options={{ title: "My QR" }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Students" component={StudentsScreen} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, booting, isAdmin } = useAuth();

  if (booting) {
    return (
      <View className="flex-1 items-center justify-center bg-ink">
        <ActivityIndicator size="large" color="#FFC400" />
      </View>
    );
  }

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

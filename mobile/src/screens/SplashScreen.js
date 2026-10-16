import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "../components/ui";

const INTRO_MS = 1800; // minimum time the brand is on screen
const native = true;

/**
 * Brand intro shown on app launch (PickMe style).
 * Stays up until the intro has played AND `ready` is true, then fades out and calls onFinish.
 */
export default function SplashScreen({ ready, onFinish }) {
  const insets = useSafeAreaInsets();
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: native }),
      Animated.timing(text, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
    ]).start();
    Animated.timing(bar, { toValue: 1, duration: INTRO_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    const t = setTimeout(() => setIntroDone(true), INTRO_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!introDone || !ready) return;
    Animated.timing(exit, { toValue: 0, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver: native }).start(onFinish);
  }, [introDone, ready]);

  const rise = (v, from = 16) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { opacity: exit, transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }] },
        styles.root,
      ]}
    >
      {/* soft glow behind the mark */}
      <Animated.View
        style={[styles.glow, { opacity: logo.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }) }]}
      />

      <Animated.View style={{ opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
        <Logo size={96} />
      </Animated.View>

      <Animated.View style={[styles.title, rise(text)]}>
        <Text className="text-center text-3xl text-white" style={{ fontFamily: "Poppins_700Bold" }}>
          Student Management
        </Text>
        <Text className="text-center text-3xl text-brand" style={{ fontFamily: "Poppins_700Bold" }}>
          QR System
        </Text>
        <Text className="mt-3 text-center text-sm text-white/50">Scan · Identify · Learn</Text>
      </Animated.View>

      <View className="absolute left-0 right-0 items-center" style={{ bottom: insets.bottom + 48 }}>
        <View className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <Animated.View style={[styles.bar, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
        </View>
        <Text className="mt-3 text-xs font-semibold text-white/30">v1.0.0</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", backgroundColor: "#0B0B0F", paddingHorizontal: 32 },
  glow: { position: "absolute", width: 288, height: 288, borderRadius: 144, backgroundColor: "#FFC400" },
  title: { marginTop: 32, alignItems: "center" },
  bar: { height: 4, borderRadius: 2, backgroundColor: "#FFC400" },
});

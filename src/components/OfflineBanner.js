import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useNetwork } from "../services/NetworkProvider";

export default function OfflineBanner() {
  const { isOnline } = useNetwork();
  const [hasMounted, setHasMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    if (!isOnline) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOnline, hasMounted, slideAnim, opacityAnim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          // opacity: opacityAnim,
          opacity: 1,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.banner}>
        <Text style={styles.text}>No connection. Offline mode is active.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 24,
    left: 14,
    right: 14,
    zIndex: 9999,
    alignItems: "center",
  },
  banner: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginTop: 5,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 13,
  },
});
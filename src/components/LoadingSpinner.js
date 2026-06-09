import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text, Surface } from "react-native-paper";

function DotRotation({ color = "#6200ee" }) {
  const dots = useMemo(() => Array.from({ length: 3 }), []);
  const anim = useRef(dots.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = dots.map((_, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim[i], {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(anim[i], {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      )
    );

    loops.forEach((l, i) => setTimeout(() => l.start(), i * 160));

    return () => loops.forEach((l) => l.stop());
  }, [anim, dots]);

  return (
    <View style={styles.dotsWrap} pointerEvents="none">
      {dots.map((_, i) => {
        const opacity = anim[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1],
        });
        const translateY = anim[i].interpolate({
          inputRange: [0, 1],
          outputRange: [2, -2],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: color, opacity, transform: [{ translateY }] },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function LoadingSpinner({
  text = "Loading...",
  fullScreen = false,
}) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <Surface style={styles.surface}>
          <DotRotation />
          <Text style={styles.text}>{text}</Text>
        </Surface>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DotRotation />
      <Text style={styles.smallText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 10,
  },
  surface: {
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    elevation: 4,
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  smallText: {
    fontSize: 14,
    color: "#666",
  },
  dotsWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: 48,
    minHeight: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});

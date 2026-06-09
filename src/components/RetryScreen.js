import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Text, Surface } from "react-native-paper";

export default function RetryScreen({ onRetry }) {
  return (
    <View style={styles.container}>
      <Surface style={styles.card}>
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Database unavailable</Text>
        <Text style={styles.subtitle}>
          We couldn’t initialize the app storage. Please try again.
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(98, 0, 238, 0.06)",
  },
  logo: {
    width: 84,
    height: 84,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6200ee",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

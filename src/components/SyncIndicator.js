import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text } from "react-native-paper";
import { useSelector } from "react-redux";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetwork } from "../services/NetworkProvider";

export default function SyncIndicator() {
  const { isSyncing, pendingItems, lastSyncAttempt } = useSelector((state) => state.sync);
  const { isOnline } = useNetwork();

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loopAnimation;

    if (isSyncing) {
      rotateAnim.setValue(0);

      loopAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        })
      );

      loopAnimation.start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }

    return () => {
      if (loopAnimation) {
        loopAnimation.stop();
      }
    };
  }, [isSyncing, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!isSyncing && pendingItems === 0) return null;

  const statusText = isSyncing
    ? "Syncing changes..."
    : !isOnline
    ? `${pendingItems} pending offline`
    : `${pendingItems} pending sync`;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <View
        style={[
          styles.container,
          isSyncing
            ? styles.syncingContainer
            : !isOnline
            ? styles.offlinePendingContainer
            : styles.pendingContainer,
        ]}
      >
        {isSyncing ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="sync" size={16} color="#1D4ED8" />
          </Animated.View>
        ) : !isOnline ? (
          <Icon name="cloud-off-outline" size={16} color="#B45309" />
        ) : (
          <Icon name="cloud-upload-outline" size={16} color="#B45309" />
        )}

        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 64,
    right: 14,
    zIndex: 9998,
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  syncingContainer: {
    backgroundColor: "#DBEAFE",
  },

  pendingContainer: {
    backgroundColor: "#FEF3C7",
  },

  offlinePendingContainer: {
    backgroundColor: "#FDE68A",
  },

  statusText: {
    marginLeft: 7,
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
});
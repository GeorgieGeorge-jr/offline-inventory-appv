import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Vibration } from "react-native";
import { Card, Button, ActivityIndicator } from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function InlineScanner({
  visible,
  title = "Scan Item",
  subtitle = "Scan barcode or QR code",
  onScanned,
  onClose,
  successText,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLocked, setScanLocked] = useState(false);
  const [localBadge, setLocalBadge] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!successText) return;
    setLocalBadge(successText);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLocalBadge(""), 1400);
  }, [successText]);

  const handleCodeScanned = async ({ data, type }) => {
    if (scanLocked) return;

    setScanLocked(true);

    try {
      const result = await onScanned?.({ data, type });

      if (result?.successMessage) {
        setLocalBadge(result.successMessage);
        Vibration.vibrate(60);
      } else if (result?.errorMessage) {
        setLocalBadge(result.errorMessage);
      }
    } finally {
      timeoutRef.current = setTimeout(() => {
        setScanLocked(false);
      }, 1200);
    }
  };

  if (!visible) return null;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {!permission ? (
          <View style={styles.permissionState}>
            <ActivityIndicator />
            <Text style={styles.permissionText}>Preparing camera...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionState}>
            <Text style={styles.permissionText}>Camera permission needed</Text>
            <Button mode="contained" onPress={requestPermission}>
              Grant Permission
            </Button>
          </View>
        ) : (
          <View style={styles.viewport}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanLocked ? undefined : handleCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "qr",
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code39",
                  "code93",
                  "code128",
                  "itf14",
                  "pdf417",
                  "aztec",
                  "datamatrix",
                ],
              }}
            />

            <View pointerEvents="none" style={styles.overlay}>
              <View style={styles.frame} />
            </View>

            {!!localBadge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{localBadge}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {scanLocked ? "Code captured..." : "Align code inside the frame"}
          </Text>
          <Button compact mode="text" onPress={onClose}>
            Hide Scanner
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#666",
  },
  viewport: {
    height: 190,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111",
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: "72%",
    height: "58%",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 16,
  },
  badge: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    backgroundColor: "rgba(56, 142, 60, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    marginRight: 10,
  },
  permissionState: {
    height: 160,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  permissionText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },
});
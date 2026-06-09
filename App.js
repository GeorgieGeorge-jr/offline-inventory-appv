import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { Provider as PaperProvider, ActivityIndicator } from "react-native-paper";
import { Provider } from "react-redux";
import { View, StyleSheet, Image } from "react-native";
import FlashMessage from "react-native-flash-message";

import { store } from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { initDatabase } from "./src/database/Database";
import { NetworkProvider } from "./src/services/NetworkProvider";
import { SyncManager } from "./src/services/SyncManager";
import OfflineBanner from "./src/components/OfflineBanner";
import SyncIndicator from "./src/components/SyncIndicator";
import { AlertManager } from "./src/services/AlertManager";
import {
  configureNotifications,
  requestNotificationPermission,
} from "./src/services/notificationService";

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Database init error:", error);
      }

      // Stop showing the loader immediately after initDatabase completes
      if (isMounted) setDbReady(true);

      // Request notification permission after the branded loader is dismissed
      try {
        await configureNotifications();
        await requestNotificationPermission();
      } catch (e) {
        console.warn("Notification permission error:", e?.message || e);
      }
    };

    setup();

    return () => {
      isMounted = false;
    };
  }, []);



  if (!dbReady) {
    return (
      <View style={styles.loader}>
        <View style={styles.loaderCard}>
          <View style={styles.logoWrap}>
            <Image
              source={require("./assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.animatedLoaderWrap}>
            <ActivityIndicator size="small" color="#6200ee" />
          </View>
        </View>
      </View>
    );
  }




  return (
    <Provider store={store}>
      <PaperProvider>
        <NetworkProvider>
          <SyncManager />
          <AlertManager />
          <OfflineBanner />
          <SyncIndicator />
          <AppNavigator />
          <FlashMessage position="top" />
        </NetworkProvider>
      </PaperProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loaderCard: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
  animatedLoaderWrap: {
    marginTop: 18,
    opacity: 0.85,
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});


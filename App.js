import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { Provider as PaperProvider, ActivityIndicator } from "react-native-paper";
import { Provider } from "react-redux";
import { View, StyleSheet } from "react-native";
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
    const setup = async () => {
      try {
        await initDatabase();
        await configureNotifications();
        await requestNotificationPermission();
        setDbReady(true);
      } catch (error) {
        console.error("Database init error:", error);
      }
      await requestNotificationPermission();
    };

    setup();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
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
  },
});
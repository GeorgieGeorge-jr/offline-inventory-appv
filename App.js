import "react-native-get-random-values";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import { theme as appTheme } from "./src/theme";
import { Provider } from "react-redux";
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
import RetryScreen from "./src/components/RetryScreen";

const INIT_DB_TIMEOUT_MS = 10000; // timeout + fallback to retry
const MIN_STARTUP_GATE_MS = 900; // keep native splash visible long enough to avoid visible switch

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`initDatabase timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export default function App() {
  const [status, setStatus] = useState("booting"); // booting | ready | retry
  const startedAtRef = useRef(Date.now());

  const runStartup = useCallback(async () => {
    const start = Date.now();
    startedAtRef.current = start;

    try {
      // Keep render null while booting to prevent splash → loader → UI flicker.
      await withTimeout(initDatabase(), INIT_DB_TIMEOUT_MS);

      // Preload minimal app state AFTER DB is ready (non-blocking).
      // Redux persist rehydrates independently; we just schedule cheap follow-ups.
      requestAnimationFrame(() => {
        // warm-up: no-op placeholder to ensure the first paint happens quickly
      });

      // Configure notifications after DB init (as before), but never block UI longer than necessary.
      try {
        await configureNotifications();
        await requestNotificationPermission();
      } catch (e) {
        console.warn(
          "Notification permission error:",
          e?.message || e
        );
      }

      // Ensure native splash isn't dismissed immediately on very fast init transitions.
      const elapsed = Date.now() - start;
      const remaining = MIN_STARTUP_GATE_MS - elapsed;
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }

      setStatus("ready");
    } catch (error) {
      console.error("Database init error:", error);

      // Don’t show retry immediately on fast failures—keep splash visible briefly.
      const elapsed = Date.now() - start;
      const remaining = MIN_STARTUP_GATE_MS - elapsed;
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }

      setStatus("retry");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await runStartup();
    })();

    return () => {
      mounted = false;
    };
  }, [runStartup]);

  // Crucial: do not render an in-app loader during booting.
  // Returning null keeps splash-only behavior and prevents visible switch on fast devices.
  if (status === "booting") {
    return null;
  }

  if (status === "retry") {
    return <RetryScreen onRetry={runStartup} />;
  }

  return (
    <Provider store={store}>
      <PaperProvider
        theme={{
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: appTheme.colors.primary,
            background: appTheme.colors.background,
            surface: appTheme.colors.card,
            text: appTheme.colors.text,
          },
        }}
      >
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


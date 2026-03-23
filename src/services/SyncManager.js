import { useEffect, useRef } from "react";
import { useNetwork } from "./NetworkProvider";
import { showMessage } from "react-native-flash-message";
import { useDispatch } from "react-redux";
import { setLastSync, fetchProducts } from "../store/inventorySlice";
import {
  setSyncing,
  setPendingItems,
  setLastSyncAttempt,
} from "../store/syncSlice";
import { getPendingSyncCount } from "./dataService";
import { runSyncEngine } from "./syncEngine";

export const SyncManager = () => {
  const { isOnline } = useNetwork();
  const dispatch = useDispatch();

  const syncInProgressRef = useRef(false);
  const firstRunRef = useRef(true);

  const refreshPending = async () => {
    try {
      const count = await getPendingSyncCount();
      dispatch(setPendingItems(count));
      return count;
    } catch (error) {
      console.error("Pending count error:", error);
      return 0;
    }
  };

  const syncData = async (showToast = false) => {
    if (!isOnline) return;
    if (syncInProgressRef.current) return;

    try {
      syncInProgressRef.current = true;
      dispatch(setSyncing(true));
      dispatch(setLastSyncAttempt(new Date().toISOString()));

      const beforeCount = await getPendingSyncCount();
      const result = await runSyncEngine();
      const afterCount = await getPendingSyncCount();

      dispatch(setPendingItems(afterCount));

      if (result.lastSync) {
        dispatch(setLastSync(result.lastSync));
      }

      if (result.pushed > 0 || result.pulled > 0 || beforeCount !== afterCount) {
        dispatch(fetchProducts());
      }

      if (showToast && (result.pushed > 0 || result.pulled > 0)) {
        showMessage({
          message: "Sync Complete",
          description: `Pushed ${result.pushed}, pulled ${result.pulled}`,
          type: "success",
          duration: 2200,
        });
      }
    } catch (error) {
      console.error("Sync error:", error);

      if (showToast) {
        showMessage({
          message: "Sync Failed",
          description: error?.message || "Could not sync",
          type: "danger",
          duration: 2200,
        });
      }
    } finally {
      syncInProgressRef.current = false;
      dispatch(setSyncing(false));
      refreshPending();
    }
  };

  useEffect(() => {
    refreshPending();

    if (isOnline) {
      syncData(!firstRunRef.current);
    }

    firstRunRef.current = false;

    const quickInterval = setInterval(() => {
      refreshPending();

      if (isOnline) {
        syncData(false);
      }
    }, 10000);

    return () => clearInterval(quickInterval);
  }, [isOnline]);

  return null;
};
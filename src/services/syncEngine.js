import { getPendingSyncCount, syncQueueToServer, getLastSyncValue } from "./dataService";

export async function runSyncEngine() {
  const pendingBefore = await getPendingSyncCount();
  const result = await syncQueueToServer();
  const pendingAfter = await getPendingSyncCount();
  const lastSync = await getLastSyncValue();

  return {
    pendingBefore,
    pendingAfter,
    pushed: result.pushed,
    pulled: result.pulled,
    lastSync,
  };
}
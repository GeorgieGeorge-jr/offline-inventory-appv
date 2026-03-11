import { createSlice } from '@reduxjs/toolkit';

const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    isSyncing: false,
    pendingItems: 0,
    lastSyncAttempt: null,
    syncErrors: []
  },
  reducers: {
    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },
    setPendingItems: (state, action) => {
      state.pendingItems = action.payload;
    },
    setLastSyncAttempt: (state, action) => {
      state.lastSyncAttempt = action.payload;
    },
    addSyncError: (state, action) => {
      state.syncErrors.push(action.payload);
    },
    clearSyncErrors: (state) => {
      state.syncErrors = [];
    }
  }
});

export const { setSyncing, setPendingItems, setLastSyncAttempt, addSyncError, clearSyncErrors } = syncSlice.actions;
export default syncSlice.reducer;

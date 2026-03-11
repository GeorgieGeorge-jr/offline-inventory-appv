import { useEffect } from 'react';
import { useNetwork } from './NetworkProvider';
import { db } from '../database/Database';
import { showMessage } from 'react-native-flash-message';
import { useDispatch } from 'react-redux';
import { setLastSync, fetchProducts } from '../store/inventorySlice';
import {
  setSyncing,
  setPendingItems,
  setLastSyncAttempt,
} from '../store/syncSlice';

export const SyncManager = () => {
  const { isOnline } = useNetwork();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOnline) {
      syncData();
    }

    const interval = setInterval(() => {
      checkPendingItems();
    }, 30000);

    checkPendingItems();

    return () => clearInterval(interval);
  }, [isOnline]);

  const checkPendingItems = async () => {
    try {
      const result = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM products WHERE is_synced = 0'
      );

      dispatch(setPendingItems(result?.count ?? 0));
    } catch (error) {
      console.error('Error checking pending items:', error);
    }
  };

  const syncData = async () => {
    try {
      dispatch(setSyncing(true));
      dispatch(setLastSyncAttempt(new Date().toISOString()));

      const unsyncedProducts = await getUnsyncedProducts();
      const unsyncedTransactions = await getUnsyncedTransactions();

      if (unsyncedProducts.length === 0 && unsyncedTransactions.length === 0) {
        dispatch(setPendingItems(0));
        return;
      }

      await simulateSync(unsyncedProducts, unsyncedTransactions);
      await markAsSynced(unsyncedProducts, unsyncedTransactions);

      dispatch(setLastSync(new Date().toISOString()));
      dispatch(setPendingItems(0));
      dispatch(fetchProducts());

      showMessage({
        message: 'Sync Complete',
        description: `Synced ${unsyncedProducts.length} products and ${unsyncedTransactions.length} transactions`,
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Sync error:', error);

      showMessage({
        message: 'Sync Failed',
        description: error?.message || 'An unknown error occurred during sync',
        type: 'danger',
      });
    } finally {
      dispatch(setSyncing(false));
    }
  };

  const getUnsyncedProducts = async () => {
    try {
      const rows = await db.getAllAsync(
        'SELECT * FROM products WHERE is_synced = 0'
      );
      return rows ?? [];
    } catch (error) {
      console.error('Error fetching unsynced products:', error);
      throw error;
    }
  };

  const getUnsyncedTransactions = async () => {
    try {
      const rows = await db.getAllAsync(
        'SELECT * FROM transactions WHERE synced = 0'
      );
      return rows ?? [];
    } catch (error) {
      console.error('Error fetching unsynced transactions:', error);
      throw error;
    }
  };

  const simulateSync = async (products, transactions) => {
    // TODO: Replace with actual API calls to your backend
    console.log('Syncing to server:', { products, transactions });

    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const markAsSynced = async (products, transactions) => {
    try {
      await db.withTransactionAsync(async () => {
        for (const product of products) {
          await db.runAsync(
            'UPDATE products SET is_synced = 1, pending_operation = NULL WHERE id = ?',
            [product.id]
          );
        }

        for (const transaction of transactions) {
          await db.runAsync(
            'UPDATE transactions SET synced = 1 WHERE id = ?',
            [transaction.id]
          );
        }
      });
    } catch (error) {
      console.error('Error marking records as synced:', error);
      throw error;
    }
  };

  return null;
};
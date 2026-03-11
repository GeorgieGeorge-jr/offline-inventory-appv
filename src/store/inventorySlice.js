import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../database/Database';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Async thunks for offline-first operations
export const fetchProducts = createAsyncThunk(
  'inventory/fetchProducts',
  async () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM products ORDER BY updated_at DESC',
          [],
          (_, { rows }) => {
            const products = rows._array;
            resolve(products);
          },
          (_, error) => reject(error)
        );
      });
    });
  }
);

export const addProduct = createAsyncThunk(
  'inventory/addProduct',
  async (productData, { getState }) => {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const product = {
      id,
      ...productData,
      created_at: timestamp,
      updated_at: timestamp,
      is_synced: 0,
      pending_operation: 'CREATE'
    };

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO products (id, name, sku, category, quantity, min_stock_level, 
           unit_price, description, barcode, created_at, updated_at, is_synced, pending_operation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [product.id, product.name, product.sku, product.category, product.quantity,
           product.min_stock_level, product.unit_price, product.description, product.barcode,
           product.created_at, product.updated_at, product.is_synced, product.pending_operation],
          () => resolve(product),
          (_, error) => reject(error)
        );
      });
    });
  }
);

export const updateStock = createAsyncThunk(
  'inventory/updateStock',
  async ({ productId, quantity, type, notes }, { dispatch }) => {
    const transactionId = uuidv4();
    const timestamp = new Date().toISOString();

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Update product quantity
        tx.executeSql(
          'UPDATE products SET quantity = quantity + ?, updated_at = ?, is_synced = 0, pending_operation = ? WHERE id = ?',
          [type === 'IN' ? quantity : -quantity, timestamp, 'UPDATE', productId],
          () => {
            // Record transaction
            tx.executeSql(
              `INSERT INTO transactions (id, product_id, type, quantity, timestamp, notes, synced)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [transactionId, productId, type, quantity, timestamp, notes, 0],
              () => {
                dispatch(fetchProducts());
                resolve({ success: true });
              },
              (_, error) => reject(error)
            );
          },
          (_, error) => reject(error)
        );
      });
    });
  }
);

export const getLowStockAlerts = createAsyncThunk(
  'inventory/getLowStockAlerts',
  async () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM products WHERE quantity <= min_stock_level',
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }
);

export const deleteProduct = createAsyncThunk(
  'inventory/deleteProduct',
  async (productId, { dispatch }) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM products WHERE id = ?',
          [productId],
          () => {
            dispatch(fetchProducts());
            resolve({ success: true });
          },
          (_, error) => reject(error)
        );
      });
    });
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    products: [],
    transactions: [],
    alerts: [],
    loading: false,
    error: null,
    lastSync: null
  },
  reducers: {
    setLastSync: (state, action) => {
      state.lastSync = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
        state.loading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      })
      .addCase(getLowStockAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload;
      });
  }
});

export const { setLastSync, clearError } = inventorySlice.actions;
export default inventorySlice.reducer;

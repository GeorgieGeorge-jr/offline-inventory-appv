import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  addProductLocal,
  deleteProductLocal,
  getProducts,
  updateStockLocal,
} from "../services/dataService";

export const fetchProducts = createAsyncThunk("inventory/fetchProducts", async () => {
  return await getProducts();
});

export const addProduct = createAsyncThunk("inventory/addProduct", async (productData) => {
  return await addProductLocal(productData);
});

export const deleteProduct = createAsyncThunk("inventory/deleteProduct", async (productId) => {
  await deleteProductLocal(productId);
  return String(productId);
});

export const updateStock = createAsyncThunk(
  "inventory/updateStock",
  async ({ productId, quantity, type, user_id, note }) => {
    return await updateStockLocal({ productId, quantity, type, user_id, note });
  }
);

export const getLowStockAlerts = createAsyncThunk("inventory/getLowStockAlerts", async () => {
  const products = await getProducts();
  return products.filter((p) => Number(p.quantity) <= Number(p.min_stock_level));
});

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    products: [],
    alerts: [],
    loading: false,
    error: null,
    lastSync: null,
  },
  reducers: {
    setLastSync: (state, action) => {
      state.lastSync = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
        state.loading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => String(p.id) !== String(action.payload));
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.products = state.products.map((p) =>
          String(p.id) === String(action.payload.id) ? action.payload : p
        );
      })
      .addCase(getLowStockAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload;
      });
  },
});

export const { setLastSync } = inventorySlice.actions;
export default inventorySlice.reducer;
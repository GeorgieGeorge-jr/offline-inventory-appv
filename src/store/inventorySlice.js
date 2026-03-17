import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_BASE_URL } from "../utils/api";

export const fetchProducts = createAsyncThunk("inventory/fetchProducts", async () => {
  const response = await fetch(`${API_BASE_URL}/products`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch products");
  }

  return data;
});

export const addProduct = createAsyncThunk("inventory/addProduct", async (productData) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to add product");
  }

  return data;
});

export const deleteProduct = createAsyncThunk("inventory/deleteProduct", async (productId) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete product");
  }

  return productId;
});

export const updateStock = createAsyncThunk(
  "inventory/updateStock",
  async ({ productId, quantity, type, user_id }) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, type, user_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update stock");
    }

    return data;
  }
);

export const getLowStockAlerts = createAsyncThunk("inventory/getLowStockAlerts", async () => {
  const response = await fetch(`${API_BASE_URL}/products`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch low stock alerts");
  }

  return data.filter((p) => Number(p.quantity) <= Number(p.min_stock_level));
});

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    products: [],
    alerts: [],
    loading: false,
    error: null,
  },
  reducers: {},
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
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.products = state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
      })
      .addCase(getLowStockAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload;
      });
  },
});

export default inventorySlice.reducer;
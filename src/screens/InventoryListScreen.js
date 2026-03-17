import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { fetchProducts } from "../store/inventorySlice";

export default function InventoryListScreen() {
  const { products, loading } = useSelector((state) => state.inventory);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const renderProduct = ({ item }) => {
    const lowStock = Number(item.quantity) <= Number(item.min_stock_level);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ProductDetails", { productId: item.id })}
      >
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={[styles.qty, lowStock && styles.lowStock]}>
            Qty: {item.quantity}
          </Text>
        </View>

        <Text style={styles.meta}>Code: {item.product_code}</Text>
        <Text style={styles.meta}>Category: {item.category || "—"}</Text>
        <Text style={styles.meta}>Price: ₦{Number(item.unit_price || 0).toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddProduct")}>
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        contentContainerStyle={products.length === 0 ? styles.emptyState : styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchProducts())} />}
        ListEmptyComponent={
          <View>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Products in MySQL will show here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 50},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  title: { fontSize: 24, fontWeight: "bold" },
  addButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: "white", fontWeight: "bold" },
  list: { padding: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  name: { fontSize: 17, fontWeight: "bold" },
  qty: { fontSize: 14, fontWeight: "600", color: "#2e7d32" },
  lowStock: { color: "#d32f2f" },
  meta: { color: "#666", marginTop: 2 },
  emptyState: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  emptySubtext: { color: "#666", textAlign: "center" },
});
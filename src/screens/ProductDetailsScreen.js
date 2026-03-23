import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useDispatch } from "react-redux";
import { deleteProduct } from "../store/inventorySlice";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getProductById } from "../services/dataService";

export default function ProductDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { productId } = route.params || {};

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

    const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await getProductById(productId);
      if (!data) throw new Error("Failed to load product");
      setProduct(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const stockStatus =
    Number(product.quantity) === 0
      ? { text: "Out of Stock", color: "#F44336" }
      : Number(product.quantity) <= Number(product.min_stock_level)
      ? { text: "Low Stock", color: "#FF9800" }
      : { text: "In Stock", color: "#4CAF50" };

  const totalValue = Number(product.unit_price || 0) * Number(product.quantity || 0);

  const handleDelete = () => {
    Alert.alert("Delete Product", `Delete "${product.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(deleteProduct(product.id)).unwrap();
            Alert.alert("Deleted", "Product deleted successfully");
            navigation.goBack();
          } catch (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.code}>Code: {product.product_code}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Quantity</Text>
          <Text style={[styles.value, { color: stockStatus.color }]}>
            {product.quantity} ({stockStatus.text})
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Unit Price</Text>
          <Text style={styles.value}>₦{Number(product.unit_price || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Total Value</Text>
          <Text style={styles.value}>₦{totalValue.toFixed(2)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{product.category || "—"}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Min Stock</Text>
          <Text style={styles.value}>{product.min_stock_level}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Barcode</Text>
          <Text style={styles.value}>{product.barcode || "—"}</Text>
        </View>

        <View style={styles.descriptionBlock}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.description}>{product.description || "No description"}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4CAF50" }]}
          onPress={() => navigation.navigate("StockIn", { productId: product.id, type: "IN" })}
        >
          <Text style={styles.buttonText}>Stock In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#FF9800" }]}
          onPress={() => navigation.navigate("StockOut", { productId: product.id, type: "OUT" })}
        >
          <Text style={styles.buttonText}>Stock Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: "#F44336" }]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete Product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "white", margin: 15, padding: 20, borderRadius: 12 },
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  code: { fontSize: 16, color: "#666", marginBottom: 15 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 16, fontWeight: "bold" },
  value: { fontSize: 16 },
  descriptionBlock: { marginTop: 15 },
  description: { marginTop: 6, color: "#666", lineHeight: 20 },
  actions: { padding: 15 },
  button: { padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
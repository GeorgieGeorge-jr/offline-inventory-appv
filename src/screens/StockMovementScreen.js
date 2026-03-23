import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { IconButton } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { updateStock, fetchProducts } from "../store/inventorySlice";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getProductByBarcodeOrCode } from "../services/dataService";
import InlineScanner from "../components/InlineScanner";

export default function StockMovementScreen() {
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanBadge, setScanBadge] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = useSelector((state) => state.inventory.products);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { type, productId } = route.params || {};

  React.useEffect(() => {
    if (productId && products.length) {
      const found = products.find((p) => p.id === productId);
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, [productId, products]);

  const handleSubmit = async () => {
    const qty = Number(quantity);
    const effectiveProductId = selectedProduct?.id || productId;

    if (!effectiveProductId || !qty || qty <= 0) {
      Alert.alert("Error", "Scan/select a product and enter a valid quantity");
      return;
    }

    try {
      setLoading(true);

      await dispatch(
        updateStock({
          productId: effectiveProductId,
          quantity: qty,
          type: type === "IN" ? "IN" : "OUT",
        })
      ).unwrap();

      await dispatch(fetchProducts());
      Alert.alert("Success", `Stock ${type === "IN" ? "added" : "removed"} successfully`);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

    const handleProductScan = async ({ data }) => {
    try {
      const product = await getProductByBarcodeOrCode(data);

      if (!product) {
        throw new Error("Product not found");
      }

      setSelectedProduct(product);
      const msg = `Scanned: ${product.name}`;
      setScanBadge(msg);
      return { successMessage: msg };
    } catch (error) {
      return { errorMessage: "Product not found" };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>{type === "IN" ? "Stock In" : "Stock Out"}</Text>

        <View style={styles.productHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Product</Text>
            <Text style={styles.productText}>
              {selectedProduct
                ? `${selectedProduct.name} (${selectedProduct.product_code})`
                : productId
                ? `Product ID: ${productId}`
                : "No product selected"}
            </Text>
          </View>

          <IconButton
            icon={scannerVisible ? "barcode-off" : "barcode-scan"}
            mode="contained-tonal"
            size={24}
            onPress={() => setScannerVisible((prev) => !prev)}
          />
        </View>

        <InlineScanner
          visible={scannerVisible}
          title={`Scan Product for Stock ${type === "IN" ? "In" : "Out"}`}
          subtitle="Scan barcode or QR code to select product"
          onScanned={handleProductScan}
          onClose={() => setScannerVisible(false)}
          successText={scanBadge}
        />

        <TextInput
          style={styles.input}
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: type === "IN" ? "#4CAF50" : "#F44336" }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Updating..." : type === "IN" ? "Add Stock" : "Remove Stock"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", justifyContent: "center" },
  form: { backgroundColor: "white", margin: 20, padding: 20, borderRadius: 12 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  productText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "white",
    fontSize: 16,
  },
  button: { padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
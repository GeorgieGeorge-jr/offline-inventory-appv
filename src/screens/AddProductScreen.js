import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { IconButton } from "react-native-paper";
import { useDispatch } from "react-redux";
import { addProduct } from "../store/inventorySlice";
import { useNavigation } from "@react-navigation/native";
import InlineScanner from "../components/InlineScanner";

export default function AddProductScreen() {
  const [name, setName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [minStockLevel, setMinStockLevel] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanBadge, setScanBadge] = useState("");

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!name.trim() || !productCode.trim()) {
      Alert.alert("Error", "Product name and product code are required");
      return;
    }

    try {
      setLoading(true);

      const productData = {
        product_code: productCode.trim(),
        name: name.trim(),
        category: category.trim() || null,
        quantity: Number(quantity) || 0,
        min_stock_level: Number(minStockLevel) || 10,
        unit_price: Number(price) || 0,
        barcode: barcode.trim() || null,
        description: description.trim() || null,
      };

      await dispatch(addProduct(productData)).unwrap();
      Alert.alert("Success", "Product added successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeCaptured = async ({ data }) => {
    const scanned = String(data || "").trim();
    setBarcode(scanned);
    const message = `Scanned: ${scanned}`;
    setScanBadge(message);
    return { successMessage: message };
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Add New Product</Text>

        <TextInput style={styles.input} placeholder="Product Name *" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Product Code *" value={productCode} onChangeText={setProductCode} />
        <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Unit Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Initial Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Min Stock Level" value={minStockLevel} onChangeText={setMinStockLevel} keyboardType="numeric" />

        <View style={styles.barcodeRow}>
          <TextInput
            style={[styles.input, styles.barcodeInput]}
            placeholder="Barcode"
            value={barcode}
            onChangeText={setBarcode}
          />
          <IconButton
            icon={scannerVisible ? "barcode-scan-off" : "barcode-scan"}
            mode="contained-tonal"
            size={24}
            onPress={() => setScannerVisible((prev) => !prev)}
          />
        </View>

        <InlineScanner
          visible={scannerVisible}
          title="Scan Product Barcode"
          subtitle="Scan barcode or QR code to fill the barcode field"
          onScanned={handleBarcodeCaptured}
          onClose={() => setScannerVisible(false)}
          successText={scanBadge}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Adding..." : "Add Product"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  form: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "white",
    fontSize: 16,
  },
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  barcodeInput: {
    flex: 1,
    marginBottom: 0,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  button: {
    backgroundColor: "#6200ee",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
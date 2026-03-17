import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text, FlatList, Alert, TouchableOpacity } from "react-native";
import { Button, Card, Searchbar, Snackbar, IconButton } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { API_BASE_URL } from "../utils/api";
import InlineScanner from "../components/InlineScanner";

export default function StaffSalesScreen() {
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanBadge, setScanBadge] = useState("");

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showMessage = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      const data = await res.json();

      if (res.ok) {
        setProducts(data);
      } else {
        console.error("Failed to load products:", data.message);
      }
    } catch (error) {
      console.error("Product load error:", error);
      showMessage("Could not load products");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return products.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const code = String(p.product_code || "").toLowerCase();
      const barcode = String(p.barcode || "").toLowerCase();

      return name.includes(q) || code.includes(q) || barcode.includes(q);
    });
  }, [products, searchQuery]);

  const addToCart = (product) => {
    const availableQty = Number(product.quantity);

    if (availableQty <= 0) {
      showMessage("Out of stock");
      return { success: false };
    }

    let addedQuantity = 1;
    let wasExisting = false;

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);

      if (existing) {
        wasExisting = true;

        if (existing.quantity >= availableQty) {
          showMessage(`Maximum available quantity reached (${availableQty})`);
          addedQuantity = existing.quantity;
          return prev;
        }

        addedQuantity = existing.quantity + 1;

        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: Number(product.unit_price),
          available_quantity: availableQty,
        },
      ];
    });

    return {
      success: true,
      successMessage: `Scanned: ${product.name} x${wasExisting ? addedQuantity : 1}`,
    };
  };

  const increaseCartItem = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      showMessage("Product no longer available");
      return;
    }

    const availableQty = Number(product.quantity);

    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;

        if (item.quantity >= availableQty) {
          showMessage(`Maximum available quantity reached (${availableQty})`);
          return item;
        }

        return { ...item, quantity: item.quantity + 1 };
      })
    );
  };

  const decreaseCartItem = (productId) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const checkout = async () => {
    if (!cart.length) {
      showMessage("Cart is empty");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_user_id: authUser.id,
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Sale failed", data.message || "Could not complete sale");
        return;
      }

      Alert.alert(
        "Success",
        `Sale completed successfully.\nTotal: ₦${Number(data.total_amount).toFixed(2)}`
      );

      setCart([]);
      setSearchQuery("");
      setScanBadge("");
      loadProducts();
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Error", "Network or server error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Do you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          dispatch(logout());
        },
      },
    ]);
  };

  const lookupScannedProduct = async (rawCode) => {
    const res = await fetch(`${API_BASE_URL}/products/lookup/${encodeURIComponent(rawCode)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Scanned product not found");
    }

    return data;
  };

  const handleScannerRead = async ({ data }) => {
    try {
      const product = await lookupScannedProduct(data);

      setProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        if (exists) {
          return prev.map((p) => (p.id === product.id ? product : p));
        }
        return [product, ...prev];
      });

      const result = addToCart(product);
      setSearchQuery("");
      setScanBadge(result?.successMessage || "");
      return result;
    } catch (error) {
      setSearchQuery(String(data || ""));
      return { errorMessage: "Scanned code not found" };
    }
  };

  const renderProductRow = ({ item }) => (
    <TouchableOpacity style={styles.productRow} onPress={() => addToCart(item)}>
      <View style={styles.productInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.product_code || "No code"} • Qty: {item.quantity}
        </Text>
      </View>
      <Text style={styles.itemTotal}>₦{Number(item.unit_price).toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const renderCartRow = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.productInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          ₦{item.unit_price.toFixed(2)} × {item.quantity}
        </Text>
      </View>

      <View style={styles.cartRight}>
        <Text style={styles.itemTotal}>₦{(item.unit_price * item.quantity).toFixed(2)}</Text>

        <View style={styles.qtyControls}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseCartItem(item.product_id)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qtyText}>{item.quantity}</Text>

          <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseCartItem(item.product_id)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.removeBtn} onPress={() => removeCartItem(item.product_id)}>
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const searching = searchQuery.trim().length > 0;
  const noSearchResults = searching && filteredProducts.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>Sales Terminal</Text>
          {!!authUser?.full_name && (
            <Text style={styles.staffName}>Staff: {authUser.full_name}</Text>
          )}
        </View>

        <IconButton icon="logout" size={24} onPress={handleLogout} style={styles.logoutButton} />
      </View>

      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Search by name, code or barcode"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.search}
        />

        <IconButton
          icon={scannerVisible ? "barcode-scan-off" : "barcode-scan"}
          size={26}
          mode="contained-tonal"
          onPress={() => setScannerVisible((prev) => !prev)}
          style={styles.scanButton}
        />
      </View>

      <InlineScanner
        visible={scannerVisible}
        title="Scan Item"
        subtitle="Scan barcode or QR code to add directly to cart"
        onScanned={handleScannerRead}
        onClose={() => setScannerVisible(false)}
        successText={scanBadge}
      />

      {searching && (
        <Card style={styles.productListCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Products</Text>

            {noSearchResults ? (
              <Text style={styles.emptyText}>Stock unavailable</Text>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderProductRow}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.cartCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Current Cart</Text>

          {cart.length === 0 ? (
            <Text style={styles.emptyText}>No items added yet</Text>
          ) : (
            <FlatList
              data={cart}
              keyExtractor={(item) => String(item.product_id)}
              renderItem={renderCartRow}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.totalCard}>
        <Card.Content style={styles.totalContent}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₦{total.toFixed(2)}</Text>
          </View>

          <Button
            mode="contained"
            icon="cash-register"
            onPress={checkout}
            loading={loading}
            disabled={loading}
          >
            Checkout
          </Button>
        </Card.Content>
      </Card>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2200}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
    paddingTop: 50,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left",
  },
  staffName: {
    marginTop: 2,
    color: "#666",
    fontSize: 13,
  },
  logoutButton: {
    margin: 0,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    
  },
  search: {
    flex: 1,
    color: "red",
  },
  scanButton: {
    marginLeft: 8,
    marginRight: 0,
  },
  productListCard: {
    maxHeight: 220,
    marginBottom: 12,
    overflow: "hidden",
  },
  cartCard: {
    flex: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptyText: {
    color: "#777",
    marginTop: 8,
    fontStyle: "italic",
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cartRight: {
    alignItems: "flex-end",
  },
  itemName: {
    fontWeight: "bold",
    fontSize: 15,
  },
  itemMeta: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  itemTotal: {
    fontWeight: "bold",
    fontSize: 14,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e8e8e8",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  qtyText: {
    marginHorizontal: 10,
    fontWeight: "bold",
    minWidth: 18,
    textAlign: "center",
  },
  removeBtn: {
    marginLeft: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffd9d9",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: {
    color: "#c62828",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 20,
  },
  totalCard: {
    marginBottom: 8,
  },
  totalContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: "#666",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  snackbar: {
    marginBottom: 10,
  },
});
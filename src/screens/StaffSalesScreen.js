import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Button, Card, Searchbar, Snackbar, IconButton } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import {
  createSaleLocal,
  getProductByBarcodeOrCode,
  getProducts,
  getSalesHistoryByStaffLocal,
} from "../services/dataService";
import InlineScanner from "../components/InlineScanner";

export default function StaffSalesScreen() {
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanBadge, setScanBadge] = useState("");

  const [saleHistory, setSaleHistory] = useState([]);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showMessage = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Product load error:", error);
      showMessage("Could not load products");
    }
  };

  const loadSaleHistory = async () => {
    try {
      if (!authUser?.id) return;
      const data = await getSalesHistoryByStaffLocal(authUser.id, 20);
      setSaleHistory(data);
    } catch (error) {
      console.error("Sale history load error:", error);
      showMessage("Could not load transaction history");
    }
  };

  const loadScreenData = async () => {
    await Promise.all([loadProducts(), loadSaleHistory()]);
  };

  useEffect(() => {
    loadScreenData();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadScreenData();
    } finally {
      setRefreshing(false);
    }
  };

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

  const total = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const todaySalesCount = saleHistory.length;

  const todayRevenue = saleHistory.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const checkout = async () => {
    if (!cart.length) {
      showMessage("Cart is empty");
      return;
    }

    try {
      setLoading(true);

      const data = await createSaleLocal({
        staff_user_id: authUser.id,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      Alert.alert(
        "Success",
        `Sale completed successfully.\nTotal: ₦${Number(
          data.total_amount
        ).toFixed(2)}`
      );

      setCart([]);
      setSearchQuery("");
      setScanBadge("");
      await loadScreenData();
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Error", error.message || "Could not complete sale");
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
    const product = await getProductByBarcodeOrCode(rawCode);
    if (!product) {
      throw new Error("Scanned product not found");
    }
    return product;
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

  const renderProductResult = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.productRow}
      onPress={() => addToCart(item)}
      activeOpacity={0.9}
    >
      <View style={styles.productInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.product_code || "No code"} • Qty: {item.quantity}
        </Text>
      </View>
      <Text style={styles.itemTotal}>
        ₦{Number(item.unit_price).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  const renderCartRow = (item) => (
    <View key={item.product_id} style={styles.cartItem}>
      <View style={styles.productInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          ₦{item.unit_price.toFixed(2)} × {item.quantity}
        </Text>
      </View>

      <View style={styles.cartRight}>
        <Text style={styles.itemTotal}>
          ₦{(item.unit_price * item.quantity).toFixed(2)}
        </Text>

        <View style={styles.qtyControls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => decreaseCartItem(item.product_id)}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qtyText}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => increaseCartItem(item.product_id)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeCartItem(item.product_id)}
          >
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHistoryRow = (sale) => (
    <View key={sale.sale_id} style={styles.historyCard}>
      <View style={styles.historyTopRow}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.historyTitle}>Transaction</Text>
          <Text style={styles.historyTime}>{sale.created_at}</Text>
        </View>

        <View style={styles.historyAmountBadge}>
          <Text style={styles.historyAmountText}>
            ₦{Number(sale.total_amount || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.historyMetaRow}>
        <View style={styles.historyMetaBox}>
          <Text style={styles.historyMetaLabel}>Items Sold</Text>
          <Text style={styles.historyMetaValue}>{sale.total_items}</Text>
        </View>

        <View style={styles.historyMetaBox}>
          <Text style={styles.historyMetaLabel}>Lines</Text>
          <Text style={styles.historyMetaValue}>{sale.line_count}</Text>
        </View>
      </View>

      <View style={styles.historyItemsWrap}>
        <Text style={styles.historyItemsLabel}>Items</Text>
        <Text style={styles.historyItemsText}>
          {sale.items_summary || "No item breakdown available"}
        </Text>
      </View>
    </View>
  );

  const searching = searchQuery.trim().length > 0;
  const noSearchResults = searching && filteredProducts.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.topBar}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Sales Terminal</Text>
              {!!authUser?.full_name && (
                <Text style={styles.staffName}>Staff: {authUser.full_name}</Text>
              )}
              <Text style={styles.headerSubtitle}>
                Search, scan, sell, and review your recent transactions.
              </Text>
            </View>

            <IconButton
              icon="logout"
              size={22}
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Cart Items</Text>
              <Text style={styles.statValue}>{cartItemCount}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{todaySalesCount}</Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueCardLabel}>Recent Sales Total</Text>
            <Text style={styles.valueCardAmount}>
              ₦{todayRevenue.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search by name, code or barcode"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.search}
          />

          <IconButton
            icon={scannerVisible ? "barcode-off" : "barcode-scan"}
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
              <Text style={styles.sectionTitle}>Product Results</Text>

              {noSearchResults ? (
                <Text style={styles.emptyText}>Stock unavailable</Text>
              ) : (
                filteredProducts.map(renderProductResult)
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
              cart.map(renderCartRow)
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
              contentStyle={styles.checkoutButtonContent}
              style={styles.checkoutButton}
            >
              Checkout
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.historySectionCard}>
          <Card.Content>
            <TouchableOpacity
              style={styles.historyHeaderRow}
              activeOpacity={0.85}
              onPress={() => setHistoryExpanded((prev) => !prev)}
            >
              <View>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                <Text style={styles.historySubtitle}>
                  View recent sales, sold items, time, and price
                </Text>
              </View>

              <IconButton
                icon={historyExpanded ? "chevron-up" : "chevron-down"}
                size={22}
                style={{ margin: 0 }}
              />
            </TouchableOpacity>

            {historyExpanded && (
              <>
                {saleHistory.length === 0 ? (
                  <Text style={styles.emptyText}>No transactions yet</Text>
                ) : (
                  saleHistory.map(renderHistoryRow)
                )}
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

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
    backgroundColor: "#F3F4F6",
  },

  content: {
    padding: 14,
    paddingTop: 50,
    paddingBottom: 24,
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  headerTextWrap: {
    flex: 1,
    paddingRight: 8,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
  },

  staffName: {
    marginTop: 4,
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "600",
  },

  headerSubtitle: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
  },

  logoutButton: {
    margin: 0,
    backgroundColor: "#F3F4F6",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },

  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  statValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "bold",
    color: "#4F46E5",
  },

  valueCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 16,
  },

  valueCardLabel: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },

  valueCardAmount: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "bold",
    color: "#312E81",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  search: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scanButton: {
    marginLeft: 8,
    marginRight: 0,
    backgroundColor: "#EDE9FE",
  },

  productListCard: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
  },

  cartCard: {
    marginBottom: 12,
    borderRadius: 18,
  },

  historySectionCard: {
    borderRadius: 18,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },

  historySubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: -2,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  productInfo: {
    flex: 1,
    paddingRight: 12,
  },

  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  cartRight: {
    alignItems: "flex-end",
  },

  itemName: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#111827",
  },

  itemMeta: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 3,
  },

  itemTotal: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#111827",
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
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  qtyBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },

  qtyText: {
    marginHorizontal: 10,
    fontWeight: "bold",
    minWidth: 18,
    textAlign: "center",
    color: "#111827",
  },

  removeBtn: {
    marginLeft: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },

  removeBtnText: {
    color: "#B91C1C",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 20,
  },

  totalCard: {
    marginBottom: 12,
    borderRadius: 18,
  },

  totalContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  totalAmount: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },

  checkoutButton: {
    borderRadius: 12,
    backgroundColor: "#4F46E5",
  },

  checkoutButtonContent: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  historyCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },

  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
  },

  historyTime: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  historyAmountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  historyAmountText: {
    color: "#166534",
    fontWeight: "bold",
    fontSize: 12,
  },

  historyMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  historyMetaBox: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
  },

  historyMetaLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },

  historyMetaValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },

  historyItemsWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
  },

  historyItemsLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },

  historyItemsText: {
    fontSize: 13,
    color: "#111827",
    lineHeight: 19,
  },

  snackbar: {
    margin: 12,
    borderRadius: 10,
  },
});
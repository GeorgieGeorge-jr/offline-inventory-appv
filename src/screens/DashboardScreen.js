import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  Pressable,
  ScrollView,
} from "react-native";
import { IconButton, Menu, Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { fetchProducts, updateStock } from "../store/inventorySlice";
import { getRecentStockActivity } from "../services/dataService";
import { logout } from "../store/authSlice";
import { sendLocalNotification } from "../services/notificationService";

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const authUser = useSelector((state) => state.auth.user);
  const { products } = useSelector((state) => state.inventory);

  const [lowStockModalVisible, setLowStockModalVisible] = useState(false);
  const [stockActionModalVisible, setStockActionModalVisible] = useState(false);
  const [stockActionType, setStockActionType] = useState("IN");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [recentActivity, setRecentActivity] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const loadDashboardData = async () => {
    await dispatch(fetchProducts());
    loadRecentActivity();
  };

  const loadRecentActivity = async () => {
    try {
      const data = await getRecentStockActivity(8);
      setRecentActivity(data);
    } catch (error) {
      console.error("Recent activity error:", error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dispatch]);

  const totalProducts = products.length;

  const inventoryValue = useMemo(() => {
    return products.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.unit_price || 0);
    }, 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(
      (item) => Number(item.quantity) <= Number(item.min_stock_level)
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;

    return products.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const code = (item.product_code || "").toLowerCase();
      const barcode = (item.barcode || "").toLowerCase();
      return name.includes(q) || code.includes(q) || barcode.includes(q);
    });
  }, [products, productSearch]);

  const openStockActionModal = (type) => {
    setStockActionType(type);
    setSelectedProduct(null);
    setQuantity("");
    setProductSearch("");
    setStockActionModalVisible(true);
  };

  const handleStockSubmit = async () => {
    const qty = Number(quantity);

    if (!selectedProduct) {
      Alert.alert("Select product", "Please choose a product first.");
      return;
    }

    if (!qty || qty <= 0) {
      Alert.alert("Invalid quantity", "Enter a valid quantity greater than 0.");
      return;
    }

    if (stockActionType === "OUT" && qty > Number(selectedProduct.quantity)) {
      Alert.alert(
        "Insufficient stock",
        `Only ${selectedProduct.quantity} unit(s) available.`
      );
      return;
    }

    try {
      await dispatch(
        updateStock({
          productId: selectedProduct.id,
          quantity: qty,
          type: stockActionType,
          user_id: authUser?.id,
        })
      ).unwrap();

      await loadDashboardData();

      Alert.alert(
        "Success",
        `${selectedProduct.name} stock ${
          stockActionType === "IN" ? "increased" : "reduced"
        } successfully.`
      );

      setStockActionModalVisible(false);
      setSelectedProduct(null);
      setQuantity("");
      setProductSearch("");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update stock");
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

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const goToAddProduct = () => {
    closeMenu();
    navigation.navigate("AddProduct");
  };

  const goToReports = () => {
    closeMenu();
    navigation.navigate("Reports");
  };

  const goToUsers = () => {
    closeMenu();
    navigation.navigate("UsersList");
  };

  const renderSelectableProduct = ({ item }) => {
    const isSelected = selectedProduct?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.productRow, isSelected && styles.selectedProductRow]}
        onPress={() => setSelectedProduct(item)}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productMeta}>
            {item.product_code || "No code"} • Qty: {item.quantity}
          </Text>
        </View>
        <Text style={styles.productPrice}>
          ₦{Number(item.unit_price || 0).toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderLowStockItem = ({ item }) => (
    <View style={styles.lowStockRow}>
      <View>
        <Text style={styles.lowStockName}>{item.name}</Text>
        <Text style={styles.lowStockMeta}>
          {item.product_code || "No code"} • Min: {item.min_stock_level}
        </Text>
      </View>
      <Text style={styles.lowStockQty}>Qty: {item.quantity}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>
                Welcome back{authUser?.full_name ? `, ${authUser.full_name}` : ""}! 👋
              </Text>
              <Text style={styles.subtitle}>
                Here’s what’s happening in your inventory today.
              </Text>
            </View>

            <IconButton
              icon="logout"
              size={22}
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          </View>

          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.smallCardLabel}>Total Products</Text>
              <Text style={styles.big}>{totalProducts}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.smallCardLabel}>Low Stock</Text>
              <Text style={[styles.big, { color: "#F59E0B" }]}>
                {lowStockProducts.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate("Inventory")}
          activeOpacity={0.85}
        >
          <Text style={styles.statNumber}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setLowStockModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.statNumber}>{lowStockProducts.length}</Text>
          <Text style={styles.statLabel}>Low Stock Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate("Inventory")}
          activeOpacity={0.85}
        >
          <Text style={styles.statNumber}>₦{inventoryValue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Inventory Value</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickActionsTopRow}>
          <TouchableOpacity
            style={[styles.primaryQuickButton, styles.stockInButton]}
            onPress={() => openStockActionModal("IN")}
          >
            <Text style={styles.actionButtonText}>Quick Stock In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryQuickButton, styles.stockOutButton]}
            onPress={() => openStockActionModal("OUT")}
          >
            <Text style={styles.actionButtonText}>Quick Stock Out</Text>
          </TouchableOpacity>
          
        </View>

        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Button
              mode="contained"
              onPress={openMenu}
              contentStyle={styles.menuButtonContent}
              style={styles.menuButton}
              labelStyle={styles.menuButtonLabel}
            >
              More Actions
            </Button>
          }
        >
          <Menu.Item onPress={goToAddProduct} title="Add Product" />
          <Menu.Item onPress={goToUsers} title="Manage Users" />
          <Menu.Item onPress={goToReports} title="View Reports" />
        </Menu>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Stock Activity</Text>

        {recentActivity.length === 0 ? (
          <Text style={styles.placeholderText}>No recent stock activity yet.</Text>
        ) : (
          recentActivity.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.activityLeft}>
                <Text style={styles.activityTitle}>{item.product_name}</Text>
                <Text style={styles.activityMeta}>
                  {item.movement_type} • Qty: {item.quantity}
                </Text>
                <Text style={styles.activityMeta}>
                  By: {item.full_name || "System"}{" "}
                  {item.username ? `(@${item.username})` : ""}
                </Text>
              </View>
              <Text style={styles.activityTime}>{item.created_at}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory Snapshot</Text>

        {products.length === 0 ? (
          <Text style={styles.placeholderText}>No products available yet.</Text>
        ) : (
          products.slice(0, 5).map((item) => {
            const isLow = Number(item.quantity) <= Number(item.min_stock_level);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.snapshotRow}
                onPress={() =>
                  navigation.navigate("ProductDetails", { productId: item.id })
                }
              >
                <View>
                  <Text style={styles.snapshotName}>{item.name}</Text>
                  <Text style={styles.snapshotMeta}>
                    {item.product_code || "No code"}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.snapshotQty,
                    isLow ? styles.snapshotQtyLow : styles.snapshotQtyGood,
                  ]}
                >
                  Qty: {item.quantity}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <Modal
        visible={lowStockModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLowStockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Low Stock Products</Text>

            {lowStockProducts.length === 0 ? (
              <View style={styles.emptyModalState}>
                <Text style={styles.placeholderText}>
                  Products are sufficiently stocked.
                </Text>
              </View>
            ) : (
              <FlatList
                data={lowStockProducts}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderLowStockItem}
              />
            )}

            <Pressable
              style={styles.closeButton}
              onPress={() => setLowStockModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={stockActionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStockActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.tallModal]}>
            <Text style={styles.modalTitle}>
              {stockActionType === "IN" ? "Quick Stock In" : "Quick Stock Out"}
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search product by name, code or barcode"
              value={productSearch}
              onChangeText={setProductSearch}
            />

            <View style={styles.productPickerBox}>
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderSelectableProduct}
                ListEmptyComponent={
                  <Text style={styles.placeholderText}>
                    No matching products found.
                  </Text>
                }
              />
            </View>

            {selectedProduct && (
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedInfoText}>
                  Selected: {selectedProduct.name}
                </Text>
                <Text style={styles.selectedInfoSubText}>
                  Available Qty: {selectedProduct.quantity}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.quantityInput}
              placeholder="Enter quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.modalActionButton, styles.cancelButton]}
                onPress={() => setStockActionModalVisible(false)}
              >
                <Text style={styles.modalActionText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalActionButton,
                  stockActionType === "IN"
                    ? styles.stockInButton
                    : styles.stockOutButton,
                ]}
                onPress={handleStockSubmit}
              >
                <Text style={styles.modalActionText}>
                  {stockActionType === "IN" ? "Add Stock" : "Remove Stock"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  content: {
    padding: 16,
    paddingBottom: 24,
    paddingTop: 50,
  },

  topBar: {
    marginBottom: 16,
  },

  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  headerTextWrap: {
    flex: 1,
    paddingRight: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  logoutButton: {
    margin: 0,
    backgroundColor: "#F3F4F6",
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  card: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },

  smallCardLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  big: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "bold",
    color: "#4F46E5",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6200ee",
    textAlign: "center",
  },

  statLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#111",
  },

  quickActionsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  primaryQuickButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },

  menuButton: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: "#1F2937",
  },

  menuButtonContent: {
    paddingVertical: 8,
  },

  menuButtonLabel: {
    color: "#fff",
    fontWeight: "bold",
  },

  stockInButton: {
    backgroundColor: "#4CAF50",
  },

  stockOutButton: {
    backgroundColor: "#F44336",
  },

  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  activityRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  activityLeft: {
    marginBottom: 4,
  },

  activityTitle: {
    fontWeight: "bold",
    fontSize: 15,
  },

  activityMeta: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },

  activityTime: {
    color: "#888",
    fontSize: 11,
    marginTop: 4,
  },

  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  snapshotName: {
    fontSize: 15,
    fontWeight: "bold",
  },

  snapshotMeta: {
    marginTop: 2,
    color: "#666",
    fontSize: 12,
  },

  snapshotQty: {
    fontWeight: "bold",
  },

  snapshotQtyLow: {
    color: "#F44336",
  },

  snapshotQtyGood: {
    color: "#2E7D32",
  },

  placeholderText: {
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "75%",
  },

  tallModal: {
    maxHeight: "88%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#111",
  },

  emptyModalState: {
    paddingVertical: 30,
  },

  lowStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  lowStockName: {
    fontWeight: "bold",
    fontSize: 15,
  },

  lowStockMeta: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },

  lowStockQty: {
    color: "#F44336",
    fontWeight: "bold",
  },

  closeButton: {
    backgroundColor: "#6200ee",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },

  productPickerBox: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    maxHeight: 250,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  selectedProductRow: {
    backgroundColor: "#f1e8ff",
    borderRadius: 8,
  },

  productInfo: {
    flex: 1,
    paddingRight: 10,
  },

  productName: {
    fontWeight: "bold",
    fontSize: 15,
  },

  productMeta: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },

  productPrice: {
    fontWeight: "bold",
    color: "#6200ee",
  },

  selectedInfo: {
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  selectedInfoText: {
    fontWeight: "bold",
    color: "#111",
  },

  selectedInfoSubText: {
    color: "#666",
    marginTop: 2,
  },

  quantityInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },

  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalActionButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },

  cancelButton: {
    backgroundColor: "#9E9E9E",
  },

  modalActionText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
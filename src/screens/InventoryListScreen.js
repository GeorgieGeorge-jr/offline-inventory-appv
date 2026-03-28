import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Menu, Button, IconButton } from "react-native-paper";
import { fetchProducts } from "../store/inventorySlice";

export default function InventoryListScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { products = [], loading } = useSelector((state) => state.inventory);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState("NAME_ASC");
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      await dispatch(fetchProducts()).unwrap?.();
    } catch (error) {
      await dispatch(fetchProducts());
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const totalProducts = products.length;

  const lowStockCount = useMemo(() => {
    return products.filter(
      (item) =>
        Number(item.quantity || 0) > 0 &&
        Number(item.quantity || 0) <= Number(item.min_stock_level || 0)
    ).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((item) => Number(item.quantity || 0) <= 0).length;
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, item) => {
      return (
        sum +
        Number(item.quantity || 0) * Number(item.unit_price || 0)
      );
    }, 0);
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        const name = String(item.name || "").toLowerCase();
        const code = String(item.product_code || "").toLowerCase();
        const barcode = String(item.barcode || "").toLowerCase();
        const category = String(item.category || "").toLowerCase();

        return (
          name.includes(q) ||
          code.includes(q) ||
          barcode.includes(q) ||
          category.includes(q)
        );
      });
    }

    if (activeFilter === "IN_STOCK") {
      result = result.filter(
        (item) => Number(item.quantity || 0) > Number(item.min_stock_level || 0)
      );
    }

    if (activeFilter === "LOW_STOCK") {
      result = result.filter(
        (item) =>
          Number(item.quantity || 0) > 0 &&
          Number(item.quantity || 0) <= Number(item.min_stock_level || 0)
      );
    }

    if (activeFilter === "OUT_OF_STOCK") {
      result = result.filter((item) => Number(item.quantity || 0) <= 0);
    }

    if (sortBy === "NAME_ASC") {
      result.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }

    if (sortBy === "NAME_DESC") {
      result.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
    }

    if (sortBy === "QTY_ASC") {
      result.sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));
    }

    if (sortBy === "QTY_DESC") {
      result.sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0));
    }

    if (sortBy === "PRICE_ASC") {
      result.sort((a, b) => Number(a.unit_price || 0) - Number(b.unit_price || 0));
    }

    if (sortBy === "PRICE_DESC") {
      result.sort((a, b) => Number(b.unit_price || 0) - Number(a.unit_price || 0));
    }

    return result;
  }, [products, searchQuery, activeFilter, sortBy]);

  const getStockStatus = (item) => {
    const qty = Number(item.quantity || 0);
    const min = Number(item.min_stock_level || 0);

    if (qty <= 0) {
      return { label: "Out of Stock", style: styles.statusOut };
    }

    if (qty <= min) {
      return { label: "Low Stock", style: styles.statusLow };
    }

    return { label: "In Stock", style: styles.statusGood };
  };

  const renderFilterChip = (label, value) => {
    const active = activeFilter === value;

    return (
      <TouchableOpacity
        style={[styles.filterChip, active && styles.filterChipActive]}
        onPress={() => setActiveFilter(value)}
      >
        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProductCard = ({ item }) => {
    const status = getStockStatus(item);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.productCard}
        onPress={() =>
          navigation.navigate("ProductDetails", { productId: item.id })
        }
      >
        <View style={styles.productCardTop}>
          <View style={styles.productTextWrap}>
            <Text style={styles.productTitle}>{item.name}</Text>
            <Text style={styles.productSub}>
              {item.product_code || "No code"}
              {item.category ? ` • ${item.category}` : ""}
            </Text>
          </View>

          <View style={[styles.statusBadge, status.style]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.productMetaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Quantity</Text>
            <Text style={styles.metaValue}>{item.quantity}</Text>
          </View>

          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Unit Price</Text>
            <Text style={styles.metaValue}>₦{Number(item.unit_price || 0).toFixed(2)}</Text>
          </View>

          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Min Stock</Text>
            <Text style={styles.metaValue}>{item.min_stock_level || 0}</Text>
          </View>

          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Value</Text>
            <Text style={styles.metaValue}>
              ₦
              {(
                Number(item.quantity || 0) * Number(item.unit_price || 0)
              ).toFixed(2)}
            </Text>
          </View>
        </View>

        {!!item.barcode && (
          <Text style={styles.barcodeText}>Barcode: {item.barcode}</Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.detailsHint}>Tap to view details</Text>
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor="#6B7280"
            style={{ margin: 0 }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const hasSearchOrFilter = searchQuery.trim() || activeFilter !== "ALL";

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>
          {hasSearchOrFilter ? "No matching products" : "No products yet"}
        </Text>
        <Text style={styles.emptyStateText}>
          {hasSearchOrFilter
            ? "Try changing your search or filter."
            : "Start by adding your first product to inventory."}
        </Text>

        {!hasSearchOrFilter && (
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate("AddProduct")}
          >
            <Text style={styles.emptyStateButtonText}>Add Product</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAndSortedProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProductCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.headerCard}>
              <View style={styles.headerTopRow}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.pageTitle}>Inventory</Text>
                  <Text style={styles.pageSubtitle}>
                    Monitor stock levels, product value, and item status at a glance.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate("AddProduct")}
                >
                  <Text style={styles.addButtonText}>+ Add Product</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Products</Text>
                  <Text style={styles.summaryValue}>{totalProducts}</Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Low Stock</Text>
                  <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>
                    {lowStockCount}
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Out of Stock</Text>
                  <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
                    {outOfStockCount}
                  </Text>
                </View>
              </View>

              <View style={styles.valueCard}>
                <Text style={styles.valueCardLabel}>Total Inventory Value</Text>
                <Text style={styles.valueCardAmount}>
                  ₦{totalInventoryValue.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.toolsCard}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, code, barcode, or category"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.filterRow}>
                {renderFilterChip("All", "ALL")}
                {renderFilterChip("In Stock", "IN_STOCK")}
                {renderFilterChip("Low", "LOW_STOCK")}
                {renderFilterChip("Out", "OUT_OF_STOCK")}
              </View>

              <Menu
                visible={sortMenuVisible}
                onDismiss={() => setSortMenuVisible(false)}
                anchor={
                  <Button
                    mode="contained"
                    onPress={() => setSortMenuVisible(true)}
                    style={styles.sortButton}
                    contentStyle={styles.sortButtonContent}
                    labelStyle={styles.sortButtonLabel}
                  >
                    Sort Products
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setSortBy("NAME_ASC");
                    setSortMenuVisible(false);
                  }}
                  title="Name: A - Z"
                />
                <Menu.Item
                  onPress={() => {
                    setSortBy("NAME_DESC");
                    setSortMenuVisible(false);
                  }}
                  title="Name: Z - A"
                />
                <Menu.Item
                  onPress={() => {
                    setSortBy("QTY_ASC");
                    setSortMenuVisible(false);
                  }}
                  title="Quantity: Low to High"
                />
                <Menu.Item
                  onPress={() => {
                    setSortBy("QTY_DESC");
                    setSortMenuVisible(false);
                  }}
                  title="Quantity: High to Low"
                />
                <Menu.Item
                  onPress={() => {
                    setSortBy("PRICE_ASC");
                    setSortMenuVisible(false);
                  }}
                  title="Price: Low to High"
                />
                <Menu.Item
                  onPress={() => {
                    setSortBy("PRICE_DESC");
                    setSortMenuVisible(false);
                  }}
                  title="Price: High to Low"
                />
              </Menu>
            </View>

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {filteredAndSortedProducts.length} item
                {filteredAndSortedProducts.length === 1 ? "" : "s"} found
              </Text>
              <Text style={styles.resultsSubtitle}>
                {loading ? "Refreshing inventory..." : "Latest stock records"}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing || !!loading} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingTop: 44,
  },

  listContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  headerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
  },

  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  addButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  summaryValue: {
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

  toolsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    marginBottom: 14,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    marginBottom: 8,
  },

  filterChipActive: {
    backgroundColor: "#4F46E5",
  },

  filterChipText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 13,
  },

  filterChipTextActive: {
    color: "#FFFFFF",
  },

  sortButton: {
    borderRadius: 12,
    backgroundColor: "#111827",
  },

  sortButtonContent: {
    paddingVertical: 6,
  },

  sortButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  resultsHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },

  resultsSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  productCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  productTextWrap: {
    flex: 1,
    paddingRight: 10,
  },

  productTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
  },

  productSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  statusGood: {
    backgroundColor: "#DCFCE7",
  },

  statusLow: {
    backgroundColor: "#FEF3C7",
  },

  statusOut: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  productMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  metaBox: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  metaLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },

  metaValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },

  barcodeText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  cardFooter: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  detailsHint: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 18,
  },

  emptyStateButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  emptyStateButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
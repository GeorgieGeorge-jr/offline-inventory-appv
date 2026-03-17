import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { API_BASE_URL } from "../utils/api";

export default function ReportsScreen() {
  const [summary, setSummary] = useState(null);
  const [stockouts, setStockouts] = useState([]);
  const [topSold, setTopSold] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);

      const [summaryRes, stockoutRes, topSoldRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sales/reports/summary`),
        fetch(`${API_BASE_URL}/sales/reports/stockouts`),
        fetch(`${API_BASE_URL}/sales/reports/top-sold-today`),
      ]);

      const [summaryData, stockoutData, topSoldData] = await Promise.all([
        summaryRes.json(),
        stockoutRes.json(),
        topSoldRes.json(),
      ]);

      setSummary(summaryData);
      setStockouts(stockoutData);
      setTopSold(topSoldData);
    } catch (error) {
      console.error("Report load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReports} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
      </View>

      {summary && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{summary.total_products}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₦{Number(summary.total_inventory_value || 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Inventory Value</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{summary.low_stock_count}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{summary.out_of_stock_count}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Sold Today</Text>
        {topSold.length === 0 ? (
          <Text style={styles.emptyText}>No sales yet today</Text>
        ) : (
          topSold.map((item) => (
            <View key={item.product_id} style={styles.itemRow}>
              <Text style={styles.itemTitle}>{item.product_name}</Text>
              <Text style={styles.itemMeta}>Sold: {item.total_sold}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sold Out Items / Who Sold Them</Text>
        {stockouts.length === 0 ? (
          <Text style={styles.emptyText}>No sold-out items yet</Text>
        ) : (
          stockouts.map((item, index) => (
            <View key={`${item.sale_id}-${item.product_id}-${index}`} style={styles.itemRow}>
              <Text style={styles.itemTitle}>{item.product_name}</Text>
              <Text style={styles.itemMeta}>Code: {item.product_code}</Text>
              <Text style={styles.itemMeta}>Sold qty: {item.sold_quantity}</Text>
              <Text style={styles.itemMeta}>By: {item.full_name} (@{item.username})</Text>
              <Text style={styles.itemMeta}>Time: {item.sold_at}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 20, backgroundColor: "white" },
  title: { fontSize: 24, fontWeight: "bold" },
  statsContainer: { flexDirection: "row", flexWrap: "wrap", padding: 10 },
  statCard: {
    backgroundColor: "white",
    padding: 20,
    margin: 5,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    minWidth: "40%",
  },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "#6200ee" },
  statLabel: { fontSize: 14, color: "#666", marginTop: 5 },
  section: { backgroundColor: "white", margin: 10, padding: 15, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  itemRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  itemTitle: { fontSize: 16, fontWeight: "bold" },
  itemMeta: { color: "#666", marginTop: 2 },
  emptyText: { color: "#666", fontStyle: "italic" },
});
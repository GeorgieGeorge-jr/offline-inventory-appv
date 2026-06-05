import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { db } from "../database/Database"; // Ensure case sensitivity matches
import { API_BASE_URL, assertApiBaseUrl, getAuthHeaders } from "../utils/api";

export default function ReportsScreen() {
  const [summary, setSummary] = useState(null);
  const [stockouts, setStockouts] = useState([]);
  const [topSold, setTopSold] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Data Fetching Logic ---

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Try to fetch from API for live data
      try {
        assertApiBaseUrl();
        const headers = await getAuthHeaders();
        const [summaryRes, stockoutRes, topSoldRes] = await Promise.all([
          fetch(`${API_BASE_URL}/sales/reports/summary`, { headers }),
          fetch(`${API_BASE_URL}/sales/reports/stockouts`, { headers }),
          fetch(`${API_BASE_URL}/sales/reports/top-sold-today`, { headers }),
        ]);

        if (!summaryRes.ok || !stockoutRes.ok || !topSoldRes.ok) {
          throw new Error("API report request failed");
        }

        const [summaryData, stockoutData, topSoldData] = await Promise.all([
          summaryRes.json(),
          stockoutRes.json(),
          topSoldRes.json(),
        ]);

        setSummary(summaryData.summary || summaryData);
        setStockouts(stockoutData.stockouts || stockoutData || []);
        setTopSold(topSoldData.products || topSoldData || []);
      } catch (apiError) {
        console.log("API unavailable, switching to local database reports...");
        await loadLocalReports();
      }
    } catch (error) {
      console.error("Report load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fallback to Local SQLite database if offline
  const loadLocalReports = async () => {
    try {
      // Query for Top Sold
      const topSoldLocal = await db.getAllAsync(`
        SELECT 
          p.id as product_id,
          p.name as product_name, 
          SUM(si.quantity) as total_sold
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY si.product_id
        ORDER BY total_sold DESC
        LIMIT 5;
      `);

      // Query for Summary Stats
      const stats = await db.getFirstAsync(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN quantity <= min_stock_level AND quantity > 0 THEN 1 ELSE 0 END) as low_stock_count,
          SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock_count,
          SUM(quantity * unit_price) as total_inventory_value
        FROM products
      `);

      const stockoutsLocal = await db.getAllAsync(`
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.product_code,
          p.quantity AS current_quantity,
          s.id AS sale_id,
          s.created_at AS sold_at,
          u.id AS staff_user_id,
          u.full_name,
          u.username,
          si.quantity AS sold_quantity
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        LEFT JOIN users u ON u.id = s.staff_user_id
        WHERE p.quantity = 0
        ORDER BY datetime(s.created_at) DESC
      `);

      setTopSold(topSoldLocal || []);
      setSummary(stats);
      setStockouts(stockoutsLocal || []);
    } catch (err) {
      console.error("Local report error:", err);
    }
  };

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // --- UI Render ---

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadReports} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header & Inventory Value */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>
          Inventory health and fast-moving products.
        </Text>

        {summary && (
          <View style={styles.valueCard}>
            <Text style={styles.valueCardLabel}>Total Inventory Value</Text>
            <Text style={styles.valueCardAmount}>
              ₦{Number(summary.total_inventory_value || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </Text>
          </View>
        )}
      </View>

      {/* Statistics Grid */}
      {summary && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Products</Text>
            <Text style={styles.statNumber}>{summary.total_products}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Low Stock</Text>
            <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
              {summary.low_stock_count}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Out of Stock</Text>
            <Text style={[styles.statNumber, { color: "#EF4444" }]}>
              {summary.out_of_stock_count}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statNumber, { fontSize: 18 }]}>
              {loading ? "Syncing..." : "Live"}
            </Text>
          </View>
        </View>
      )}

      {/* Top Sold Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Sold Items</Text>
          <Text style={styles.sectionSubtitle}>
            Best performing products
          </Text>
        </View>

        {topSold.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sales data</Text>
          </View>
        ) : (
          topSold.map((item, index) => (
            <View key={item.product_id} style={styles.topSoldCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.topSoldInfo}>
                <Text style={styles.itemTitle}>{item.product_name}</Text>
                <Text style={styles.itemMeta}>Total Sold: {item.total_sold}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Sold Out Activity Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stock Out Activity</Text>
        </View>

        {stockouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No recent stockouts</Text>
          </View>
        ) : (
          stockouts.map((item, index) => (
            <View key={`${item.sale_id}-${index}`} style={styles.stockoutCard}>
              <View style={styles.stockoutTopRow}>
                <Text style={styles.itemTitle}>{item.product_name}</Text>
                <View style={styles.stockoutBadge}>
                  <Text style={styles.stockoutBadgeText}>Sold Out</Text>
                </View>
              </View>
              <View style={styles.metaGrid}>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>Sold By</Text>
                  <Text style={styles.metaValue}>{item.full_name}</Text>
                </View>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>Time</Text>
                  <Text style={styles.metaValue}>{item.sold_at}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// --- Styles (Identical to your provided design) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", paddingTop: 44 },
  content: { padding: 16, paddingBottom: 28 },
  headerCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, marginBottom: 16, elevation: 3 },
  title: { fontSize: 26, fontWeight: "bold", color: "#111827" },
  subtitle: { marginTop: 6, fontSize: 14, color: "#6B7280" },
  valueCard: { marginTop: 18, backgroundColor: "#EEF2FF", borderRadius: 16, padding: 16 },
  valueCardLabel: { fontSize: 13, color: "#4B5563", fontWeight: "600" },
  valueCardAmount: { marginTop: 8, fontSize: 26, fontWeight: "bold", color: "#312E81" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 },
  statCard: { width: "48%", backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 14, marginBottom: 12, elevation: 2 },
  statLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  statNumber: { marginTop: 8, fontSize: 24, fontWeight: "bold", color: "#4F46E5" },
  section: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, marginBottom: 16, elevation: 2 },
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: "bold", color: "#111827" },
  sectionSubtitle: { marginTop: 4, fontSize: 13, color: "#6B7280" },
  topSoldCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, marginBottom: 12 },
  rankBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center", marginRight: 12 },
  rankText: { color: "#FFFFFF", fontWeight: "bold" },
  topSoldInfo: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  itemMeta: { marginTop: 4, color: "#6B7280", fontSize: 13 },
  stockoutCard: { backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, marginBottom: 12 },
  stockoutTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  stockoutBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  stockoutBadgeText: { color: "#B91C1C", fontWeight: "700", fontSize: 12 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metaBox: { width: "48%", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginBottom: 10 },
  metaLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  metaValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  emptyState: { backgroundColor: "#F9FAFB", borderRadius: 14, paddingVertical: 24, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
});

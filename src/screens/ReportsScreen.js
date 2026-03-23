import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
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
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadReports} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>
          Get a quick view of inventory health, fast-moving products, and sold-out activity.
        </Text>

        {summary && (
          <View style={styles.valueCard}>
            <Text style={styles.valueCardLabel}>Total Inventory Value</Text>
            <Text style={styles.valueCardAmount}>
              ₦{Number(summary.total_inventory_value || 0).toFixed(2)}
            </Text>
          </View>
        )}
      </View>

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
            <Text style={styles.statLabel}>Report Status</Text>
            <Text style={[styles.statNumber, { fontSize: 18 }]}>
              {loading ? "Updating..." : "Live"}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Sold Today</Text>
          <Text style={styles.sectionSubtitle}>
            Best performing products based on today’s sales
          </Text>
        </View>

        {topSold.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sales yet today</Text>
            <Text style={styles.emptyText}>
              Once products are sold, they’ll appear here.
            </Text>
          </View>
        ) : (
          topSold.map((item, index) => (
            <View key={item.product_id} style={styles.topSoldCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>

              <View style={styles.topSoldInfo}>
                <Text style={styles.itemTitle}>{item.product_name}</Text>
                <Text style={styles.itemMeta}>
                  Total Sold: {item.total_sold}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sold Out Items / Who Sold Them</Text>
          <Text style={styles.sectionSubtitle}>
            Tracks items that ran out and the related sales activity
          </Text>
        </View>

        {stockouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sold-out items yet</Text>
            <Text style={styles.emptyText}>
              Sold-out items will be listed here with sales details.
            </Text>
          </View>
        ) : (
          stockouts.map((item, index) => (
            <View
              key={`${item.sale_id}-${item.product_id}-${index}`}
              style={styles.stockoutCard}
            >
              <View style={styles.stockoutTopRow}>
                <Text style={styles.itemTitle}>{item.product_name}</Text>
                <View style={styles.stockoutBadge}>
                  <Text style={styles.stockoutBadgeText}>Sold Out</Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>Product Code</Text>
                  <Text style={styles.metaValue}>
                    {item.product_code || "No code"}
                  </Text>
                </View>

                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>Sold Quantity</Text>
                  <Text style={styles.metaValue}>{item.sold_quantity}</Text>
                </View>

                <View style={styles.metaBox}>
                  <Text style={styles.metaLabel}>Sold By</Text>
                  <Text style={styles.metaValue}>
                    {item.full_name} (@{item.username})
                  </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  content: {
    padding: 16,
    paddingBottom: 28,
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

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },

  valueCard: {
    marginTop: 18,
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#312E81",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
    elevation: 2,
  },

  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  statNumber: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "bold",
    color: "#4F46E5",
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#111827",
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },

  topSoldCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  rankText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  topSoldInfo: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },

  itemMeta: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 13,
  },

  stockoutCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  stockoutTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  stockoutBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  stockoutBadgeText: {
    color: "#B91C1C",
    fontWeight: "700",
    fontSize: 12,
  },

  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  metaBox: {
    width: "48%",
    backgroundColor: "#FFFFFF",
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
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  emptyState: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },

  emptyText: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
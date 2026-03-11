import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';

export default function ReportsScreen() {
  const products = useSelector(state => state.inventory.products);

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const lowStockProducts = products.filter(product => product.quantity < 10);
  const outOfStockProducts = products.filter(product => product.quantity === 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>${totalValue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{lowStockProducts.length}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{outOfStockProducts.length}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Low Stock Alert</Text>
        {lowStockProducts.length === 0 ? (
          <Text style={styles.emptyText}>All products are well stocked</Text>
        ) : (
          lowStockProducts.map(product => (
            <View key={product.id} style={styles.productItem}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Out of Stock</Text>
        {outOfStockProducts.length === 0 ? (
          <Text style={styles.emptyText}>No products are out of stock</Text>
        ) : (
          outOfStockProducts.map(product => (
            <View key={product.id} style={styles.productItem}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    minWidth: '40%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productName: {
    fontSize: 16,
  },
  productQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import ProductCard from '../components/ProductCard';

export default function InventoryListScreen() {
  const products = useSelector(state => state.inventory.products);
  const navigation = useNavigation();

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { product });
  };

  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No products in inventory</Text>
          <Text style={styles.emptySubtext}>Tap "Add Product" to get started</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    padding: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
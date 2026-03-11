import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deleteProduct } from '../store/inventorySlice';

export default function ProductDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { product } = route.params || {};

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const handleStockIn = () => {
    navigation.navigate('StockIn', { productId: product.id });
  };

  const handleStockOut = () => {
    navigation.navigate('StockOut', { productId: product.id });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProduct(product.id)).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const getStockStatus = () => {
    if (product.quantity === 0) return { text: 'Out of Stock', color: '#F44336' };
    if (product.quantity < 10) return { text: 'Low Stock', color: '#FF9800' };
    return { text: 'In Stock', color: '#4CAF50' };
  };

  const stockStatus = getStockStatus();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.sku}>SKU: {product.sku}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Price:</Text>
          <Text style={styles.value}>${product.price.toFixed(2)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={[styles.value, { color: stockStatus.color }]}>
            {product.quantity} ({stockStatus.text})
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Total Value:</Text>
          <Text style={styles.value}>${(product.price * product.quantity).toFixed(2)}</Text>
        </View>

        {product.category && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.value}>{product.category}</Text>
          </View>
        )}

        {product.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.stockInButton]} onPress={handleStockIn}>
          <Text style={styles.buttonText}>Stock In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.stockOutButton]} onPress={handleStockOut}>
          <Text style={styles.buttonText}>Stock Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete Product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sku: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
  },
  descriptionContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    lineHeight: 20,
  },
  actions: {
    padding: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  stockInButton: {
    backgroundColor: '#4CAF50',
  },
  stockOutButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { addProduct } from '../store/inventorySlice';
import { useNavigation } from '@react-navigation/native';

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!name.trim() || !sku.trim() || !price || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim() || null,
        quantity: parseInt(quantity),
        min_stock_level: 10, // Default low stock threshold
        unit_price: parseFloat(price),
        description: description.trim() || null,
        barcode: null, // Can be added later
      };

      await dispatch(addProduct(productData)).unwrap();
      Alert.alert('Success', 'Product added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Add New Product</Text>

        <TextInput
          style={styles.input}
          placeholder="Product Name *"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="SKU *"
          value={sku}
          onChangeText={setSku}
        />

        <TextInput
          style={styles.input}
          placeholder="Price *"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Initial Quantity *"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Adding Product...' : 'Add Product'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
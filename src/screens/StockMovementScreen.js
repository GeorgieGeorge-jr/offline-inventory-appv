import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { updateStock } from '../store/inventorySlice';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function StockMovementScreen() {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { type, productId } = route.params || {};

  const handleSubmit = async () => {
    if (!quantity || !productId) {
      Alert.alert('Error', 'Please enter quantity and select a product');
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await dispatch(updateStock({
        productId,
        quantity: qty,
        type: type === 'IN' ? 'IN' : 'OUT',
        notes: notes.trim() || null,
      })).unwrap();

      Alert.alert('Success', `Stock ${type === 'IN' ? 'added' : 'removed'} successfully`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    backgroundColor: type === 'IN' ? '#4CAF50' : '#F44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>
          {type === 'IN' ? 'Stock In' : 'Stock Out'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Quantity *"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity style={buttonStyle} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Updating...' : (type === 'IN' ? 'Add Stock' : 'Remove Stock')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  form: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
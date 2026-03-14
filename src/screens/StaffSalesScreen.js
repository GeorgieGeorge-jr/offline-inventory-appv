import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { Button, Card, Searchbar, Title, Paragraph } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function StaffSalesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  const total = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title>Sales Terminal</Title>
          <Paragraph>Scan items or search product ID manually</Paragraph>
        </Card.Content>
      </Card>

      <Searchbar
        placeholder="Search product by code or barcode"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.search}
      />

      <View style={styles.actionsRow}>
        <Button
          mode="contained"
          icon="barcode-scan"
          style={styles.scanButton}
          onPress={() => console.log('Open scanner here')}
        >
          Scan Item
        </Button>

        <Button
          mode="outlined"
          icon="plus"
          style={styles.manualButton}
          onPress={() => console.log('Manual add here')}
        >
          Add Manually
        </Button>
      </View>

      <Card style={styles.cartCard}>
        <Card.Content>
          <Title>Current Cart</Title>
          {cart.length === 0 ? (
            <Text style={styles.emptyText}>No items added yet</Text>
          ) : (
            <FlatList
              data={cart}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>₦{item.unit_price} x {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemTotal}>₦{item.unit_price * item.quantity}</Text>
                </View>
              )}
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.totalCard}>
        <Card.Content style={styles.totalContent}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₦{total.toFixed(2)}</Text>
          </View>

          <Button
            mode="contained"
            icon="printer"
            onPress={() => console.log('Print receipt here')}
          >
            Print Receipt
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  headerCard: {
    marginBottom: 12,
  },
  search: {
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  scanButton: {
    flex: 1,
  },
  manualButton: {
    flex: 1,
  },
  cartCard: {
    flex: 1,
    marginBottom: 12,
  },
  emptyText: {
    color: '#777',
    marginTop: 8,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontWeight: 'bold',
  },
  itemMeta: {
    color: '#666',
    fontSize: 12,
  },
  itemTotal: {
    fontWeight: 'bold',
  },
  totalCard: {
    marginBottom: 8,
  },
  totalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
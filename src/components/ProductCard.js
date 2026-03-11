import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, IconButton, Menu, Divider } from 'react-native-paper';
import StockStatusBadge from './StockStatusBadge';

export default function ProductCard({ 
  product, 
  onPress, 
  onEdit, 
  onDelete, 
  onStockIn, 
  onStockOut,
  showActions = true 
}) {
  const [menuVisible, setMenuVisible] = React.useState(false);

  const totalValue = (product.quantity || 0) * (product.unit_price || 0);

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.productInfo}>
              <Title style={styles.name}>{product.name}</Title>
              <Paragraph style={styles.sku}>SKU: {product.sku}</Paragraph>
            </View>

            {showActions && (
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item onPress={() => { setMenuVisible(false); onEdit && onEdit(); }} title="Edit" icon="pencil" />
                <Menu.Item onPress={() => { setMenuVisible(false); onStockIn && onStockIn(); }} title="Stock In" icon="arrow-down-bold" />
                <Menu.Item onPress={() => { setMenuVisible(false); onStockOut && onStockOut(); }} title="Stock Out" icon="arrow-up-bold" />
                <Divider />
                <Menu.Item onPress={() => { setMenuVisible(false); onDelete && onDelete(); }} title="Delete" icon="delete" titleStyle={{ color: '#f44336' }} />
              </Menu>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Paragraph style={styles.statLabel}>Quantity</Paragraph>
              <Title style={styles.statValue}>{product.quantity}</Title>
            </View>
            <View style={styles.stat}>
              <Paragraph style={styles.statLabel}>Unit Price</Paragraph>
              <Title style={styles.statValue}>${product.unit_price?.toFixed(2) || '0.00'}</Title>
            </View>
            <View style={styles.stat}>
              <Paragraph style={styles.statLabel}>Total Value</Paragraph>
              <Title style={styles.statValue}>${totalValue.toFixed(2)}</Title>
            </View>
          </View>

          <View style={styles.footer}>
            <StockStatusBadge 
              quantity={product.quantity} 
              minStockLevel={product.min_stock_level} 
            />
            {!product.is_synced && (
              <View style={styles.unsyncedBadge}>
                <Paragraph style={styles.unsyncedText}>Pending Sync</Paragraph>
              </View>
            )}
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    elevation: 2,
    borderRadius: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  productInfo: {
    flex: 1
  },
  name: {
    fontSize: 16,
    marginBottom: 2
  },
  sku: {
    fontSize: 12,
    color: '#666'
  },
  divider: {
    marginVertical: 10
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10
  },
  stat: {
    alignItems: 'center',
    flex: 1
  },
  statLabel: {
    fontSize: 11,
    color: '#666'
  },
  statValue: {
    fontSize: 16
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  unsyncedBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  unsyncedText: {
    fontSize: 11,
    color: '#f57c00'
  }
});

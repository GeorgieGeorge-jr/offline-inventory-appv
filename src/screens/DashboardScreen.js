import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { Card, Title, Paragraph, Button, Badge, FAB, Avatar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, getLowStockAlerts } from '../store/inventorySlice';
import { useNetwork } from '../services/NetworkProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { products, alerts, loading } = useSelector(state => state.inventory);
  const { sync } = useSelector(state => state);
  const { isOnline, isInternetReachable } = useNetwork();

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      dispatch(getLowStockAlerts());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    dispatch(fetchProducts());
    dispatch(getLowStockAlerts());
  };

  const totalItems = products.length;
  const lowStockCount = alerts.length;
  const totalValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.unit_price || 0)), 0);
  const unsyncedCount = products.filter(p => !p.is_synced).length;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Connection Status */}
        <View style={[styles.statusBar, { backgroundColor: isOnline ? '#e8f5e9' : '#ffebee' }]}>
          <Icon 
            name={isOnline ? 'wifi' : 'wifi-off'} 
            size={20} 
            color={isOnline ? '#4CAF50' : '#f44336'} 
          />
          <Text style={[styles.statusText, { color: isOnline ? '#4CAF50' : '#f44336' }]}>
            {isOnline ? 'Online - Real-time Sync Active' : 'Offline Mode - Local Storage'}
          </Text>
          {unsyncedCount > 0 && (
            <Badge style={styles.syncBadge}>{unsyncedCount} pending</Badge>
          )}
        </View>

        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content style={styles.welcomeContent}>
            <Avatar.Icon size={50} icon="account-circle" style={styles.avatar} />
            <View>
              <Title>Welcome Back!</Title>
              <Paragraph>Manage your inventory efficiently</Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Icon name="package-variant" size={30} color="#6200ee" />
              <Title>{totalItems}</Title>
              <Paragraph>Total Products</Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, lowStockCount > 0 && styles.alertCard]}>
            <Card.Content>
              <Icon name="alert-circle" size={30} color={lowStockCount > 0 ? '#f44336' : '#4CAF50'} />
              <Title>{lowStockCount}</Title>
              <Paragraph>Low Stock Alerts</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Icon name="cash" size={30} color="#2196F3" />
              <Title>${totalValue.toFixed(0)}</Title>
              <Paragraph>Inventory Value</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Title title="Quick Actions" left={(props) => <Avatar.Icon {...props} icon="lightning-bolt" />} />
          <Card.Content style={styles.actions}>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('StockIn')}
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              icon="arrow-down-bold"
              contentStyle={styles.actionButtonContent}
            >
              Stock In
            </Button>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('StockOut')}
              style={[styles.actionButton, { backgroundColor: '#f44336' }]}
              icon="arrow-up-bold"
              contentStyle={styles.actionButtonContent}
            >
              Stock Out
            </Button>
          </Card.Content>
        </Card>

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <Card style={styles.alertsCard}>
            <Card.Title 
              title="Low Stock Alerts" 
              subtitle="Items requiring attention"
              left={(props) => <Avatar.Icon {...props} icon="alert" color="#fff" style={{ backgroundColor: '#f44336' }} />} 
            />
            <Card.Content>
              {alerts.slice(0, 5).map(alert => (
                <View key={alert.id} style={styles.alertItem}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertName}>{alert.name}</Text>
                    <Text style={styles.alertSku}>SKU: {alert.sku}</Text>
                  </View>
                  <View style={styles.alertQty}>
                    <Text style={styles.qtyText}>{alert.quantity}</Text>
                    <Text style={styles.minText}>Min: {alert.min_stock_level}</Text>
                  </View>
                </View>
              ))}
              {alerts.length > 5 && (
                <Button mode="text" onPress={() => navigation.navigate('Inventory')}>
                  View All Alerts
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Sync Status */}
        <Card style={styles.syncCard}>
          <Card.Content style={styles.syncContent}>
            <Icon name="sync" size={24} color="#6200ee" />
            <View style={styles.syncInfo}>
              <Text style={styles.syncTitle}>Last Sync</Text>
              <Text style={styles.syncTime}>
                {sync.lastSyncAttempt 
                  ? new Date(sync.lastSyncAttempt).toLocaleString() 
                  : 'Never'}
              </Text>
            </View>
            {sync.isSyncing && <Badge>Syncing...</Badge>}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddProduct')}
        label="Add Product"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    marginBottom: 5
  },
  statusText: {
    marginLeft: 8,
    fontWeight: 'bold',
    flex: 1
  },
  syncBadge: {
    backgroundColor: '#ff9800'
  },
  welcomeCard: {
    margin: 10,
    marginTop: 5,
    elevation: 2
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  avatar: {
    backgroundColor: '#6200ee'
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10
  },
  statCard: {
    flex: 1,
    elevation: 2
  },
  alertCard: {
    backgroundColor: '#ffebee'
  },
  actionsCard: {
    margin: 10,
    elevation: 2
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  actionButton: {
    flex: 1,
    borderRadius: 8
  },
  actionButtonContent: {
    paddingVertical: 8
  },
  alertsCard: {
    margin: 10,
    backgroundColor: '#fff3e0',
    elevation: 2
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  alertInfo: {
    flex: 1
  },
  alertName: {
    fontWeight: 'bold',
    fontSize: 16
  },
  alertSku: {
    color: '#666',
    fontSize: 12,
    marginTop: 2
  },
  alertQty: {
    alignItems: 'flex-end'
  },
  qtyText: {
    fontWeight: 'bold',
    color: '#f44336',
    fontSize: 18
  },
  minText: {
    color: '#999',
    fontSize: 12
  },
  syncCard: {
    margin: 10,
    marginBottom: 80,
    elevation: 1
  },
  syncContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  syncInfo: {
    flex: 1
  },
  syncTitle: {
    fontWeight: 'bold',
    color: '#333'
  },
  syncTime: {
    color: '#666',
    fontSize: 12
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee'
  }
});

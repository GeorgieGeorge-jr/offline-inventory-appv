import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Badge, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function StockStatusBadge({ quantity, minStockLevel, size = 'small' }) {
  const getStatus = () => {
    if (quantity <= 0) {
      return { 
        color: '#f44336', 
        backgroundColor: '#ffebee',
        text: 'Out of Stock', 
        icon: 'close-circle' 
      };
    }
    if (quantity <= minStockLevel) {
      return { 
        color: '#ff9800', 
        backgroundColor: '#fff3e0',
        text: 'Low Stock', 
        icon: 'alert-circle' 
      };
    }
    return { 
      color: '#4CAF50', 
      backgroundColor: '#e8f5e9',
      text: 'In Stock', 
      icon: 'check-circle' 
    };
  };

  const status = getStatus();
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, { backgroundColor: status.backgroundColor }, isLarge && styles.largeContainer]}>
      <Icon name={status.icon} size={isLarge ? 20 : 14} color={status.color} />
      <Text style={[styles.text, { color: status.color }, isLarge && styles.largeText]}>
        {status.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start'
  },
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  text: {
    fontSize: 11,
    fontWeight: '600'
  },
  largeText: {
    fontSize: 14
  }
});

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Surface, Text, IconButton } from 'react-native-paper';
import { useNetwork } from '../services/NetworkProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function OfflineBanner() {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <Surface style={styles.container}>
      <View style={styles.content}>
        <Icon name="wifi-off" size={20} color="#fff" />
        <Text style={styles.text}>You are offline. Changes will sync when connection is restored.</Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  }
});

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SyncIndicator() {
  const { isSyncing, pendingItems } = useSelector(state => state.sync);
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (isSyncing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      animation.setValue(0);
    }
  }, [isSyncing]);

  const spin = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (!isSyncing && pendingItems === 0) return null;

  return (
    <View style={styles.container}>
      {isSyncing ? (
        <View style={styles.syncingContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="sync" size={16} color="#6200ee" />
          </Animated.View>
          <Text style={styles.syncingText}>Syncing...</Text>
        </View>
      ) : (
        <View style={styles.pendingContainer}>
          <Icon name="cloud-upload" size={16} color="#ff9800" />
          <Text style={styles.pendingText}>{pendingItems} pending</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5
  },
  syncingText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600'
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5
  },
  pendingText: {
    fontSize: 12,
    color: '#f57c00',
    fontWeight: '600'
  }
});

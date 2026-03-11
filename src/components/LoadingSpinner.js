import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Surface } from 'react-native-paper';

export default function LoadingSpinner({ text = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <Surface style={styles.surface}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.text}>{text}</Text>
        </Surface>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#6200ee" />
      <Text style={styles.smallText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 10
  },
  surface: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 4
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: '#666'
  },
  smallText: {
    fontSize: 14,
    color: '#666'
  }
});

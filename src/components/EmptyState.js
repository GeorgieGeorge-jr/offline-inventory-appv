import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function EmptyState({ 
  icon = 'package-variant', 
  title = 'No Items Found', 
  description = 'Start by adding your first item',
  buttonText = 'Add Item',
  onButtonPress,
  showButton = true
}) {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={80} color="#ccc" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {showButton && onButtonPress && (
        <Button 
          mode="contained" 
          onPress={onButtonPress}
          style={styles.button}
          icon="plus"
        >
          {buttonText}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333'
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 20
  },
  button: {
    marginTop: 10,
    borderRadius: 8
  }
});

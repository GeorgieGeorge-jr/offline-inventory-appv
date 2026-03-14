import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { TextInput, Button, Surface, Title } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { login } from '../store/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!username || !password) return;

    try {
      setLoading(true);

      const response = await fetch('http://172.20.10.2:5001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        return;
      }

      dispatch(
        login({
          id: data.id || username,
          username,
          role: data.role,
          full_name: data.full_name,
          token: data.token,
        })
      );
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Surface style={styles.surface}>
        <View style={styles.logoContainer}>
          <Icon name="warehouse" size={80} color="#6200ee" />
          <Title style={styles.title}>Inventory Management</Title>
          <Text style={styles.subtitle}>Offline-Resilient System</Text>
        </View>

        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          left={<TextInput.Icon icon="account" />}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={secureText}
          style={styles.input}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={secureText ? 'eye-off' : 'eye'}
              onPress={() => setSecureText(!secureText)}
            />
          }
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Login
        </Button>

        <Text style={styles.hint}>Use admin1 / password or staff1 / password</Text>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    padding: 25,
    borderRadius: 15,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    marginTop: 10,
    fontSize: 24,
  },
  subtitle: {
    marginTop: 5,
    color: '#666',
    fontSize: 14,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  hint: {
    textAlign: 'center',
    marginTop: 15,
    color: '#999',
    fontSize: 12,
  },
});
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import FlashMessage from 'react-native-flash-message';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { NetworkProvider } from './src/services/NetworkProvider';
import { SyncManager } from './src/services/SyncManager';
import { initDatabase } from './src/database/Database';

export default function App() {
  useEffect(() => {
    initDatabase().then(() => {
      console.log('Database initialized');
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider>
            <NetworkProvider>
              <SyncManager />
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
              <FlashMessage position="top" />
            </NetworkProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const NetworkContext = createContext({
  isConnected: false,
  connectionType: null,
  isInternetReachable: false,
  isOnline: false,
});

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState(null);
  const [isInternetReachable, setIsInternetReachable] = useState(false);

  useEffect(() => {
    const updateNetworkState = (state) => {
      setIsConnected(!!state.isConnected);
      setConnectionType(state.type ?? null);
      setIsInternetReachable(!!state.isInternetReachable);
    };

    const unsubscribe = NetInfo.addEventListener(updateNetworkState);

    NetInfo.fetch().then(updateNetworkState);

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        connectionType,
        isInternetReachable,
        isOnline: isConnected && isInternetReachable,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
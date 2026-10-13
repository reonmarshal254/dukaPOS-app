/**
 * Network Listener Hook
 * 
 * Monitors network connectivity and triggers device sync when app comes online.
 */

import { useEffect, useRef } from 'react';
import * as Network from 'expo-network';
import { AppState, AppStateStatus } from 'react-native';
import { useForceDeviceRefresh } from './useDevice';

export function useNetworkListener() {
  const forceDeviceRefresh = useForceDeviceRefresh();
  const wasOffline = useRef<boolean | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initial network check
    checkNetworkAndSync();

    // Listen for app state changes (foreground/background)
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic network check (every 2 minutes when app is active)
    const intervalId = setInterval(() => {
      if (appState.current === 'active') {
        checkNetworkAndSync();
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => {
      appStateSubscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // When app comes to foreground, check network
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[networkListener] App came to foreground — checking network');
      checkNetworkAndSync();
    }
    appState.current = nextAppState;
  };

  const checkNetworkAndSync = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const isOnline = state.isConnected === true && state.isInternetReachable === true;

      // If we just came online (was offline before, now online), trigger sync
      if (wasOffline.current === false && isOnline) {
        console.log('[networkListener] 🌐 Network restored — triggering device sync');
        forceDeviceRefresh();
      }

      // If this is first check and we're online, trigger sync
      if (wasOffline.current === null && isOnline) {
        console.log('[networkListener] 🌐 App started online — triggering device sync');
        forceDeviceRefresh();
      }

      wasOffline.current = !isOnline;
    } catch (error) {
      console.warn('[networkListener] Network check error:', error);
    }
  };
}

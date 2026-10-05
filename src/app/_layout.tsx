import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase } from '../database';
import { initNotifications, addNotificationResponseListener } from '../services/notificationService';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60000, // 1 minute
    },
  },
});

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Database ready');

        // Initialise notifications (request permission + schedule 7am reminder)
        await initNotifications().catch((e) =>
          console.warn('Notification init warning:', e)
        );

        setIsDbReady(true);
      } catch (error: any) {
        console.error('Failed to initialize database:', error);
        setError(error.message || 'Database initialization failed');
      }
    };

    init();

    // Listen for taps on notifications for future deep-linking
    const sub = addNotificationResponseListener((data) => {
      console.log('Notification tapped:', data?.type);
    });

    return () => {
      sub.remove();
    };
  }, []);

  if (error) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <Text style={styles.errorText}>Database Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>Please restart the app</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isDbReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Initializing DukaPOS...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

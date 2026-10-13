import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  getSafeValue = <T,>(getter: () => T): T | undefined => {
    try {
      return getter();
    } catch {
      return undefined;
    }
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Report to Sentry
    try {
      const { captureException } = require('../services/sentryService');
      captureException(error, {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
      });
    } catch {
      // Sentry reporting failed, but don't crash
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  getDeviceInfo = () => {
    try {
      // Lazy import to avoid module-load-time crashes
      const Application = require('expo-application');
      const Device = require('expo-device');
      const Constants = require('expo-constants').default;

      return {
        appVersion: this.getSafeValue(() => Application.nativeApplicationVersion) || 'N/A',
        buildVersion: this.getSafeValue(() => Application.nativeBuildVersion) || 'N/A',
        deviceModel: this.getSafeValue(() => Device.modelName) || 'Unknown',
        osName: this.getSafeValue(() => Device.osName) || 'Unknown',
        osVersion: this.getSafeValue(() => Device.osVersion) || 'Unknown',
        expoVersion: this.getSafeValue(() => Constants.expoVersion) || 'N/A',
      };
    } catch {
      return {
        appVersion: 'N/A',
        buildVersion: 'N/A',
        deviceModel: 'Unknown',
        osName: 'Unknown',
        osVersion: 'Unknown',
        expoVersion: 'N/A',
      };
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const deviceInfo = this.getDeviceInfo();
      
      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. Please restart the app or contact support if this persists.
            </Text>

            {__DEV__ && error && (
              <>
                <View style={styles.errorSection}>
                  <Text style={styles.sectionTitle}>Error Message:</Text>
                  <Text style={styles.errorText}>{error.toString()}</Text>
                </View>

                {errorInfo && (
                  <View style={styles.errorSection}>
                    <Text style={styles.sectionTitle}>Stack Trace:</Text>
                    <Text style={styles.stackText}>{errorInfo.componentStack}</Text>
                  </View>
                )}

                <View style={styles.errorSection}>
                  <Text style={styles.sectionTitle}>Device Info:</Text>
                  <Text style={styles.infoText}>App Version: {deviceInfo.appVersion}</Text>
                  <Text style={styles.infoText}>Build Version: {deviceInfo.buildVersion}</Text>
                  <Text style={styles.infoText}>Device: {deviceInfo.deviceModel}</Text>
                  <Text style={styles.infoText}>OS: {deviceInfo.osName} {deviceInfo.osVersion}</Text>
                  <Text style={styles.infoText}>Expo Version: {deviceInfo.expoVersion}</Text>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    marginBottom: 24,
    lineHeight: 24,
  },
  errorSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

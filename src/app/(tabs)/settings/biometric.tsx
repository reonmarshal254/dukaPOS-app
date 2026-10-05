import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { ShieldCheckIcon } from '../../../components/common/Icons';
import Button from '../../../components/common/Button';
import {
  checkBiometricCapability,
  getBiometricTypeName,
  authenticateWithBiometric,
  isBiometricEnabled,
  setBiometricEnabled,
  BiometricCapability,
} from '../../../services/biometricAuth';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';

export default function BiometricSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBiometricStatus();
  }, []);

  const loadBiometricStatus = async () => {
    setLoading(true);
    try {
      const cap = await checkBiometricCapability();
      setCapability(cap);
      
      if (cap.isAvailable) {
        const enabled = await isBiometricEnabled();
        setIsEnabled(enabled);
      }
    } catch (error) {
      console.error('Error loading biometric status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      // Enabling - require biometric authentication first
      const authenticated = await authenticateWithBiometric();
      
      if (authenticated) {
        try {
          await setBiometricEnabled(true);
          setIsEnabled(true);
          Alert.alert(
            'Success',
            `${getBiometricTypeName(capability?.biometricType || 'none')} authentication has been enabled.`
          );
        } catch (error) {
          console.error('Error enabling biometric:', error);
          Alert.alert('Error', 'Failed to enable biometric authentication.');
        }
      } else {
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication failed. Please try again.'
        );
      }
    } else {
      // Disabling - just confirm
      Alert.alert(
        'Disable Biometric',
        `Are you sure you want to disable ${getBiometricTypeName(capability?.biometricType || 'none')} authentication?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await setBiometricEnabled(false);
                setIsEnabled(false);
              } catch (error) {
                console.error('Error disabling biometric:', error);
                Alert.alert('Error', 'Failed to disable biometric authentication.');
              }
            },
          },
        ]
      );
    }
  };

  const handleTestBiometric = async () => {
    const authenticated = await authenticateWithBiometric();
    
    if (authenticated) {
      Alert.alert('Success', 'Biometric authentication successful!');
    } else {
      Alert.alert('Failed', 'Biometric authentication failed.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking biometric capabilities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!capability || !capability.hardwareAvailable) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader
          title="Biometric Authentication"
          icon={<ShieldCheckIcon size={48} color="#FFFFFF" />}
        />

        <ScrollView 
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + SPACING.xl }
          ]}
        >
          <View style={styles.unavailableContainer}>
            <Text style={styles.unavailableIcon}>🚫</Text>
            <Text style={styles.unavailableTitle}>Not Available</Text>
            <Text style={styles.unavailableText}>
              Your device does not support biometric authentication.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!capability.enrolled) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader
          title="Biometric Authentication"
          icon={<ShieldCheckIcon size={48} color="#FFFFFF" />}
        />

        <ScrollView 
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + SPACING.xl }
          ]}
        >
          <View style={styles.unavailableContainer}>
            <Text style={styles.unavailableIcon}>⚙️</Text>
            <Text style={styles.unavailableTitle}>Setup Required</Text>
            <Text style={styles.unavailableText}>
              Please set up biometric authentication in your device settings first.
            </Text>
            <Text style={styles.unavailableHint}>
              Go to Settings → Security → Biometrics
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Biometric Authentication"
        subtitle={`Secure your app with ${getBiometricTypeName(capability.biometricType)}`}
        icon={<ShieldCheckIcon size={48} color="#FFFFFF" />}
      />

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xl }
        ]}
      >
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>
                Enable {getBiometricTypeName(capability.biometricType)}
              </Text>
              <Text style={styles.cardDescription}>
                Use {getBiometricTypeName(capability.biometricType).toLowerCase()} to unlock the app
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>

        {isEnabled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Test Authentication</Text>
            <Text style={styles.cardDescription}>
              Test your biometric authentication to make sure it works.
            </Text>
            <Button
              title={`Test ${getBiometricTypeName(capability.biometricType)}`}
              onPress={handleTestBiometric}
              style={styles.testButton}
            />
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ How it works</Text>
          <Text style={styles.infoText}>
            • Biometric authentication provides quick access to the app
          </Text>
          <Text style={styles.infoText}>
            • Your PIN is still required for first-time setup and recovery
          </Text>
          <Text style={styles.infoText}>
            • You can disable this feature anytime in settings
          </Text>
          <Text style={styles.infoText}>
            • Biometric data stays on your device and is never shared
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  unavailableContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  unavailableIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  unavailableTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  unavailableText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * 1.5,
    marginBottom: SPACING.md,
  },
  unavailableHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.4,
  },
  testButton: {
    marginTop: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.6,
    marginBottom: SPACING.xs,
  },
});

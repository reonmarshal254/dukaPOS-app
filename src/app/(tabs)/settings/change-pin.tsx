import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import PINKeypad from '../../../components/common/PINKeypad';
import Button from '../../../components/common/Button';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { LockIcon } from '../../../components/common/Icons';
import { verifyPIN, storePIN } from '../../../services/secureStorage';
import { validatePINStrength } from '../../../utils/securityConfig';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { SECURITY_CONFIG } from '../../../constants/config';

type Step = 'current' | 'new' | 'confirm';

export default function ChangePINScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeypadPress = (value: string) => {
    if (step === 'current') {
      if (currentPin.length < 4) {
        const pin = currentPin + value;
        setCurrentPin(pin);
        if (pin.length === 4) {
          verifyCurrentPin(pin);
        }
      }
    } else if (step === 'new') {
      if (newPin.length < 4) {
        const pin = newPin + value;
        setNewPin(pin);
        if (pin.length === 4) {
          validateNewPin(pin);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 4) {
        const pin = confirmPin + value;
        setConfirmPin(pin);
        if (pin.length === 4) {
          confirmNewPin(pin);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'current') {
      setCurrentPin(currentPin.slice(0, -1));
    } else if (step === 'new') {
      setNewPin(newPin.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const handleClear = () => {
    if (step === 'current') {
      setCurrentPin('');
    } else if (step === 'new') {
      setNewPin('');
    } else if (step === 'confirm') {
      setConfirmPin('');
    }
    setError('');
  };

  const verifyCurrentPin = async (pin: string) => {
    setLoading(true);
    try {
      const isValid = await verifyPIN(pin);
      
      if (isValid) {
        setStep('new');
        setError('');
      } else {
        setError('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setCurrentPin('');
          setError('');
        }, 1500);
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      Alert.alert('Error', 'Failed to verify PIN');
      setCurrentPin('');
    } finally {
      setLoading(false);
    }
  };

  const validateNewPin = (pin: string) => {
    const strengthCheck = validatePINStrength(pin);
    
    if (!strengthCheck.valid) {
      setError(strengthCheck.reason || 'PIN is too weak');
      setTimeout(() => {
        setNewPin('');
        setError('');
      }, 1500);
      return;
    }

    setStep('confirm');
    setError('');
  };

  const confirmNewPin = async (pin: string) => {
    if (pin !== newPin) {
      setError('PINs do not match');
      setTimeout(() => {
        setConfirmPin('');
        setError('');
      }, 1500);
      return;
    }

    setLoading(true);
    try {
      await storePIN(newPin);
      
      Alert.alert(
        'Success',
        'Your PIN has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error storing new PIN:', error);
      Alert.alert('Error', 'Failed to change PIN. Please try again.');
      setStep('new');
      setNewPin('');
      setConfirmPin('');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPin = () => {
    if (step === 'current') return currentPin;
    if (step === 'new') return newPin;
    return confirmPin;
  };

  const getTitle = () => {
    if (step === 'current') return 'Enter Current PIN';
    if (step === 'new') return 'Enter New PIN';
    return 'Confirm New PIN';
  };

  const getSubtitle = () => {
    if (step === 'current') return 'Verify your current PIN';
    if (step === 'new') return `${SECURITY_CONFIG.PIN_LENGTH_MIN}-${SECURITY_CONFIG.PIN_LENGTH_MAX} digits, avoid weak patterns`;
    return 'Re-enter your new PIN';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Change PIN"
        subtitle="Update your security PIN"
        icon={<LockIcon size={48} color="#FFFFFF" />}
      />

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xl }
        ]}
      >
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 'current' && styles.stepDotActive]} />
          <View style={[styles.stepDot, step === 'new' && styles.stepDotActive]} />
          <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]} />
        </View>

        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        <View style={styles.pinDisplay}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < getCurrentPin().length && styles.pinDotFilled,
                error && styles.pinDotError,
              ]}
            />
          ))}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PINKeypad
          onPress={handleKeypadPress}
          onDelete={handleDelete}
          onClear={handleClear}
          disabled={loading}
        />

        {step !== 'current' && (
          <Button
            title="Back"
            onPress={() => {
              if (step === 'new') {
                setStep('current');
                setNewPin('');
              } else {
                setStep('new');
                setConfirmPin('');
              }
              setError('');
            }}
            variant="outline"
            style={styles.backButton}
          />
        )}
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  pinDotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pinDotError: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  backButton: {
    marginTop: SPACING.xl,
  },
});

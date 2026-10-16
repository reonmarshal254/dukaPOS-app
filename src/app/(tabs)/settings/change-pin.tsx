import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LockIcon } from '../../../components/common/Icons';
import { verifyPIN, storePIN } from '../../../services/secureStorage';
import { validatePINStrength } from '../../../utils/securityConfig';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';

const { width } = Dimensions.get('window');
const KEY_SIZE = Math.min((width - SPACING.lg * 2 - SPACING.md * 2) / 3, 88);

type Step = 'current' | 'new' | 'confirm';

// ─── Keypad ────────────────────────────────────────────────────────────────────
function Keypad({
  onPress,
  onDelete,
  onClear,
  disabled = false,
}: {
  onPress: (v: string) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '←'],
  ];

  const handle = (v: string) => {
    if (disabled) return;
    if (v === '←') onDelete();
    else if (v === 'C') onClear();
    else onPress(v);
  };

  return (
    <View style={kp.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={kp.row}>
          {row.map((k) => {
            const isAction = k === 'C' || k === '←';
            return (
              <Pressable
                key={k}
                disabled={disabled}
                onPress={() => handle(k)}
                style={({ pressed }) => [
                  kp.key,
                  isAction && kp.keyAction,
                  pressed && !disabled && kp.keyPressed,
                  disabled && kp.keyDisabled,
                ]}
              >
                <Text style={[kp.keyText, isAction && kp.keyTextAction]}>
                  {k}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const kp = StyleSheet.create({
  grid: { width: '100%', alignSelf: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  keyAction: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  keyPressed: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 0.94 }],
  },
  keyDisabled: { opacity: 0.35 },
  keyText: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  keyTextAction: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: 'rgba(255,255,255,0.55)',
  },
});

// ─── PIN dots ──────────────────────────────────────────────────────────────────
function PINDots({
  filled,
  hasError,
}: {
  filled: number;
  hasError: boolean;
}) {
  return (
    <View style={dd.row}>
      {Array.from({ length: 4 }).map((_, i) => {
        const active = i < filled;
        return (
          <View
            key={i}
            style={[
              dd.dot,
              active && (hasError ? dd.dotError : dd.dotFilled),
            ]}
          />
        );
      })}
    </View>
  );
}

const DOT = 20;
const dd = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  dotError: {
    backgroundColor: '#FCA5A5',
    borderColor: '#FCA5A5',
  },
});

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function ChangePINScreen() {
  const router = useRouter();
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
        setError('Incorrect PIN. Try again.');
        setTimeout(() => {
          setCurrentPin('');
          setError('');
        }, 900);
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
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
      }, 900);
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
      }, 900);
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

  const handleBack = () => {
    if (step === 'new') {
      setStep('current');
      setNewPin('');
      setError('');
    } else if (step === 'confirm') {
      setStep('new');
      setConfirmPin('');
      setError('');
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
    if (step === 'new') return '4-digit PIN, avoid weak patterns';
    return 'Re-enter your new PIN';
  };

  const bg: [string, string, string] = [COLORS.primary, COLORS.primaryDark, '#1E3A8A'];

  return (
    <LinearGradient
      colors={bg}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Decorative circles */}
      <View style={s.circle1} />
      <View style={s.circle2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={s.screen}>
          {/* Brand */}
          <View style={s.top}>
            <View style={s.iconWrap}>
              <LockIcon size={32} color="#FFFFFF" />
            </View>
            <Text style={s.brandName}>Change PIN</Text>
            <Text style={s.subtitle}>{getSubtitle()}</Text>
            
            {/* Step indicator */}
            <View style={s.stepIndicator}>
              <View style={[s.stepDot, step === 'current' && s.stepDotActive]} />
              <View style={[s.stepDot, step === 'new' && s.stepDotActive]} />
              <View style={[s.stepDot, step === 'confirm' && s.stepDotActive]} />
            </View>
          </View>

          {/* PIN dots */}
          <PINDots filled={getCurrentPin().length} hasError={!!error} />

          {/* Status */}
          <Text style={[s.statusText, error && s.statusError]}>
            {error || (loading ? 'Processing...' : ' ')}
          </Text>

          {/* Keypad */}
          <Keypad
            onPress={handleKeypadPress}
            onDelete={handleDelete}
            onClear={handleClear}
            disabled={loading}
          />

          {/* Footer */}
          <View style={s.footer}>
            {step !== 'current' && (
              <Pressable style={s.textBtn} onPress={handleBack}>
                <Text style={s.textBtnText}>← Back</Text>
              </Pressable>
            )}
            <Pressable style={s.textBtn} onPress={() => router.back()}>
              <Text style={s.textBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    justifyContent: 'space-evenly',
  },

  // Decorative circles
  circle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 60,
    left: -80,
  },

  // Brand block
  top: { alignItems: 'center', gap: SPACING.sm },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
  },

  // Status text
  statusText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
    height: 20,
  },
  statusError: {
    color: '#FCA5A5',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  textBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  textBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

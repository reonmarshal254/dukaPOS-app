import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/common/Button';
import { KeyIcon } from '../../components/common/Icons';
import { storePIN, storeSecurityQuestion } from '../../services/secureStorage';
import { validatePIN } from '../../utils/validation';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { SECURITY_CONFIG } from '../../constants/config';
import { validatePINStrength } from '../../utils/securityConfig';

const { width } = Dimensions.get('window');
const KEY_SIZE = Math.min((width - SPACING.lg * 2 - SPACING.md * 2) / 3, 88);

type SetupStep = 'enter' | 'confirm' | 'security-question' | 'security-answer';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What is your favorite food?",
  "What was your childhood nickname?",
];

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


export default function SetPINScreen() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const handleKeypadPress = (value: string) => {
    if (step === 'enter') {
      if (pin.length < 4) {
        const newPin = pin + value;
        setPin(newPin);
        
        if (newPin.length === 4) {
          handlePINEntered(newPin);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 4) {
        const newConfirmPin = confirmPin + value;
        setConfirmPin(newConfirmPin);
        
        if (newConfirmPin.length === 4) {
          handlePINConfirmed(newConfirmPin);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const handleClear = () => {
    if (step === 'enter') {
      setPin('');
    } else if (step === 'confirm') {
      setConfirmPin('');
    }
    setError('');
  };

  const handlePINEntered = (enteredPin: string) => {
    if (!validatePIN(enteredPin)) {
      setError(`PIN must be ${SECURITY_CONFIG.PIN_LENGTH_MIN}-${SECURITY_CONFIG.PIN_LENGTH_MAX} digits`);
      setTimeout(() => {
        setPin('');
        setError('');
      }, 1500);
      return;
    }
    
    // Validate PIN strength
    const strengthCheck = validatePINStrength(enteredPin);
    if (!strengthCheck.valid) {
      setError(strengthCheck.reason || 'PIN is too weak');
      setTimeout(() => {
        setPin('');
        setError('');
      }, 1500);
      return;
    }
    
    setError('');
    // Move to confirmation step
    setTimeout(() => {
      setStep('confirm');
    }, 200);
  };

  const handlePINConfirmed = (enteredPin: string) => {
    if (enteredPin !== pin) {
      setError('PINs do not match');
      // Reset after showing error
      setTimeout(() => {
        setConfirmPin('');
        setError('');
      }, 1000);
      return;
    }

    // PINs match, move to security question
    setError('');
    setTimeout(() => {
      setStep('security-question');
    }, 200);
  };

  const handleQuestionSelected = (question: string) => {
    setSelectedQuestion(question);
    setStep('security-answer');
  };

  const handleFinishSetup = async () => {
    if (!securityAnswer.trim()) {
      Alert.alert('Error', 'Please enter your security answer');
      return;
    }

    if (securityAnswer.trim().length < 3) {
      Alert.alert('Error', 'Security answer is too short');
      return;
    }

    setLoading(true);
    try {
      // Store PIN first
      await storePIN(pin);
      
      // Store security question and answer
      await storeSecurityQuestion(selectedQuestion, securityAnswer);
      
      console.log('PIN and security question set successfully');
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error storing PIN and security question:', error);
      Alert.alert('Error', 'Failed to set up your account. Please try again.');
      setStep('enter');
      setPin('');
      setConfirmPin('');
      setSelectedQuestion('');
      setSecurityAnswer('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
      setError('');
    } else if (step === 'security-answer') {
      setStep('security-question');
      setSecurityAnswer('');
    } else if (step === 'security-question') {
      setStep('confirm');
    }
  };

  // Render security question selection
  if (step === 'security-question') {
    const bg: [string, string, string] = [COLORS.primary, COLORS.primaryDark, '#1E3A8A'];
    return (
      <LinearGradient colors={bg} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={s.recoveryScroll} showsVerticalScrollIndicator={false}>
            <View style={s.recoveryIconWrap}>
              <KeyIcon size={36} color="#FFFFFF" />
            </View>
            <Text style={s.recoveryTitle}>Security Question</Text>
            <Text style={s.recoverySubtitle}>Choose a question for PIN recovery</Text>

            <View style={{ marginTop: SPACING.xl }}>
              {SECURITY_QUESTIONS.map((question, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    s.glassCard,
                    s.questionOption,
                    pressed && s.questionOptionPressed,
                  ]}
                  onPress={() => handleQuestionSelected(question)}
                >
                  <Text style={s.questionOptionText}>{question}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: SPACING.xl }}>
              <Button title="Back" onPress={handleBack} variant="outline" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Render security answer input
  if (step === 'security-answer') {
    const bg: [string, string, string] = [COLORS.primary, COLORS.primaryDark, '#1E3A8A'];
    return (
      <LinearGradient colors={bg} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={s.recoveryScroll} showsVerticalScrollIndicator={false}>
            <View style={s.recoveryIconWrap}>
              <KeyIcon size={36} color="#FFFFFF" />
            </View>
            <Text style={s.recoveryTitle}>Security Answer</Text>
            <Text style={s.recoverySubtitle}>This will help you recover your PIN</Text>

            <View style={s.glassCard}>
              <Text style={s.glassCardLabel}>Your Question</Text>
              <Text style={s.glassCardText}>{selectedQuestion}</Text>
            </View>

            <View style={{ marginBottom: SPACING.xl }}>
              <Text style={s.inputLabel}>Your Answer</Text>
              <TextInput
                style={s.input}
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
                placeholder="Type your answer…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <View style={{ gap: SPACING.sm }}>
              <Button title="Complete Setup" onPress={handleFinishSetup} loading={loading} />
              <Button title="Back" onPress={handleBack} variant="outline" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Render PIN entry/confirmation with unlock screen design
  const currentPin = step === 'enter' ? pin : confirmPin;
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
            <View style={s.logoWrap}>
              <Text style={s.logoLetter}>D</Text>
            </View>
            <Text style={s.brandName}>DukaPOS</Text>
            <Text style={s.subtitle}>
              {step === 'enter'
                ? `Create a ${SECURITY_CONFIG.PIN_LENGTH_MIN}-${SECURITY_CONFIG.PIN_LENGTH_MAX} digit PIN to secure your app`
                : 'Re-enter your PIN to confirm'}
            </Text>
          </View>

          {/* PIN dots */}
          <PINDots filled={currentPin.length} hasError={!!error} />

          {/* Status */}
          <Text style={[s.statusText, error && s.statusError]}>
            {error || (loading ? 'Setting up...' : ' ')}
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
            {step === 'confirm' && !loading && (
              <Pressable style={s.textBtn} onPress={handleBack}>
                <Text style={s.textBtnText}>← Back</Text>
              </Pressable>
            )}
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
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
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
    lineHeight: 20,
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

  // Recovery
  recoveryScroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  recoveryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  recoveryTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  recoverySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassCardLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
  },
  glassCardText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#FFFFFF',
  },
  questionOption: {
    marginBottom: SPACING.md,
  },
  questionOptionPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  questionOptionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: 22,
  },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyIcon } from '../../components/common/Icons';
import Button from '../../components/common/Button';
import {
  verifyPIN,
  getFailedAttempts,
  resetFailedAttempts,
  getSecurityQuestion,
  verifySecurityAnswer,
  storePIN,
  isLockedOut,
  getLockoutEndTime,
  startLockout,
} from '../../services/secureStorage';
import {
  isBiometricEnabled,
  authenticateWithBiometric,
} from '../../services/biometricAuth';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { SECURITY_CONFIG } from '../../constants/config';

const { width } = Dimensions.get('window');
const KEY_SIZE = Math.min((width - SPACING.lg * 2 - SPACING.md * 2) / 3, 88);

type RecoveryStep = 'none' | 'question' | 'new-pin' | 'confirm-pin';

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
export default function UnlockScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [lockoutIntervalId, setLockoutIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('none');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    loadFailedAttempts();
    attemptBiometricAuth();
    isBiometricEnabled().then(setShowBiometric);
    return () => { if (lockoutIntervalId) clearInterval(lockoutIntervalId); };
  }, []);

  const attemptBiometricAuth = async () => {
    try {
      if (!(await isBiometricEnabled())) return;
      setTimeout(async () => {
        if (await authenticateWithBiometric()) router.replace('/(tabs)');
      }, 500);
    } catch (_) {}
  };

  const loadFailedAttempts = async () => {
    const attempts = await getFailedAttempts();
    setFailedAttempts(attempts);
    if (await isLockedOut()) {
      const endTime = await getLockoutEndTime();
      if (endTime) { setIsLocked(true); startExistingLockoutTimer(endTime); }
    } else if (attempts >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
      initiateNewLockout();
    }
  };

  const startExistingLockoutTimer = (endTime: Date) => {
    const remaining = Math.max(0, Math.ceil((endTime.getTime() - Date.now()) / 1000));
    setLockoutTimer(remaining);
    if (lockoutIntervalId) clearInterval(lockoutIntervalId);
    const id = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setLockoutIntervalId(null);
          resetFailedAttempts().then(() => {
            setIsLocked(false); setFailedAttempts(0); setError(''); setPin('');
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setLockoutIntervalId(id);
  };

  const initiateNewLockout = async () => {
    const endTime = await startLockout();
    setIsLocked(true);
    startExistingLockoutTimer(endTime);
  };

  const handleKeypadPress = (value: string) => {
    if (pin.length < 4) {
      const next = pin + value;
      setPin(next);
      if (next.length === 4) verifyPINAndUnlock(next);
    }
  };

  const verifyPINAndUnlock = async (entered: string) => {
    if (isLocked) return;
    setLoading(true);
    try {
      if (await verifyPIN(entered)) {
        router.replace('/(tabs)');
      } else {
        const attempts = await getFailedAttempts();
        setFailedAttempts(attempts);
        const remaining = SECURITY_CONFIG.MAX_FAILED_ATTEMPTS - attempts;
        if (remaining <= 0) {
          await initiateNewLockout();
        } else {
          setError(`Incorrect PIN — ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`);
        }
        setTimeout(() => { setPin(''); if (!isLocked) setError(''); }, 900);
      }
    } catch (_) { setPin(''); }
    finally { setLoading(false); }
  };

  const handleForgotPin = async () => {
    const question = await getSecurityQuestion();
    if (!question) return;
    setSecurityQuestion(question);
    setRecoveryStep('question');
  };

  const handleVerifySecurityAnswer = async () => {
    if (!securityAnswer.trim()) return;
    setLoading(true);
    try {
      if (await verifySecurityAnswer(securityAnswer)) {
        await resetFailedAttempts();
        setFailedAttempts(0); setIsLocked(false);
        setRecoveryStep('new-pin'); setSecurityAnswer('');
      } else {
        setSecurityAnswer('');
      }
    } finally { setLoading(false); }
  };

  const handleNewPinKeypadPress = (value: string) => {
    if (recoveryStep === 'new-pin') {
      if (newPin.length < 4) {
        const next = newPin + value;
        setNewPin(next);
        if (next.length === 4) setRecoveryStep('confirm-pin');
      }
    } else if (recoveryStep === 'confirm-pin') {
      if (confirmNewPin.length < 4) {
        const next = confirmNewPin + value;
        setConfirmNewPin(next);
        if (next.length === 4) verifyAndSaveNewPin(next);
      }
    }
  };

  const verifyAndSaveNewPin = async (confirmed: string) => {
    if (confirmed !== newPin) {
      setError('PINs do not match');
      setTimeout(() => { setConfirmNewPin(''); setError(''); }, 900);
      return;
    }
    setLoading(true);
    try {
      await storePIN(newPin);
      setRecoveryStep('none'); setNewPin(''); setConfirmNewPin(''); setPin('');
    } finally { setLoading(false); }
  };

  const cancelRecovery = () => {
    setRecoveryStep('none'); setSecurityQuestion('');
    setSecurityAnswer(''); setNewPin(''); setConfirmNewPin(''); setError('');
  };

  // shared gradient for all screens
  const bg: [string, string, string] = [COLORS.primary, COLORS.primaryDark, '#1E3A8A'];

  // ── Recovery: security question ──────────────────────────────────────────────
  if (recoveryStep === 'question') {
    return (
      <LinearGradient colors={bg} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={s.recoveryScroll} showsVerticalScrollIndicator={false}>
            <View style={s.recoveryIconWrap}>
              <KeyIcon size={36} color="#FFFFFF" />
            </View>
            <Text style={s.recoveryTitle}>Account Recovery</Text>
            <Text style={s.recoverySubtitle}>Answer your security question to reset your PIN</Text>

            <View style={s.glassCard}>
              <Text style={s.glassCardLabel}>Security Question</Text>
              <Text style={s.glassCardText}>{securityQuestion}</Text>
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
              <Button title="Verify Answer" onPress={handleVerifySecurityAnswer} loading={loading} />
              <Button title="Cancel" onPress={cancelRecovery} variant="outline" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Recovery: set new PIN ────────────────────────────────────────────────────
  if (recoveryStep === 'new-pin' || recoveryStep === 'confirm-pin') {
    const currentPin = recoveryStep === 'new-pin' ? newPin : confirmNewPin;
    const isConfirm = recoveryStep === 'confirm-pin';
    return (
      <LinearGradient colors={bg} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={s.screen}>
            <View style={s.top}>
              <Text style={s.brandName}>DukaPOS</Text>
              <Text style={s.subtitle}>
                {isConfirm ? 'Confirm your new PIN' : 'Create a new PIN'}
              </Text>
            </View>

            <PINDots filled={currentPin.length} hasError={!!error} />

            <Text style={s.statusText}>
              {error || (loading ? 'Saving…' : ' ')}
            </Text>

            <Keypad
              onPress={handleNewPinKeypadPress}
              onDelete={() => { isConfirm ? setConfirmNewPin(p => p.slice(0, -1)) : setNewPin(p => p.slice(0, -1)); setError(''); }}
              onClear={() => { isConfirm ? setConfirmNewPin('') : setNewPin(''); setError(''); }}
              disabled={loading}
            />

            <View style={s.footer}>
              {isConfirm && (
                <Pressable style={s.textBtn} onPress={() => { setRecoveryStep('new-pin'); setConfirmNewPin(''); setError(''); }}>
                  <Text style={s.textBtnText}>← Back</Text>
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Normal unlock ────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={bg}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Subtle decorative circle */}
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
            <Text style={s.subtitle}>Enter your PIN to continue</Text>
          </View>

          {/* PIN dots */}
          <PINDots filled={pin.length} hasError={!!error} />

          {/* Status */}
          {isLocked && lockoutTimer > 0 ? (
            <View style={s.lockoutBox}>
              <Text style={s.lockoutLabel}>Account locked</Text>
              <Text style={s.lockoutTimer}>
                {Math.floor(lockoutTimer / 60)}:{String(lockoutTimer % 60).padStart(2, '0')}
              </Text>
              <Text style={s.lockoutHint}>Use "Forgot PIN?" to recover access</Text>
            </View>
          ) : (
            <Text style={[s.statusText, error && s.statusError]}>
              {error || (loading ? 'Verifying…' : ' ')}
            </Text>
          )}

          {/* Keypad */}
          <Keypad
            onPress={handleKeypadPress}
            onDelete={() => { setPin(p => p.slice(0, -1)); setError(''); }}
            onClear={() => { setPin(''); setError(''); }}
            disabled={isLocked || loading}
          />

          {/* Footer links */}
          <View style={s.footer}>
            {showBiometric && (
              <Pressable style={s.textBtn} onPress={attemptBiometricAuth}>
                <Text style={s.textBtnText}>🔐  Biometric</Text>
              </Pressable>
            )}
            <Pressable style={s.textBtn} onPress={handleForgotPin}>
              <Text style={s.textBtnText}>Forgot PIN?</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
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

  // Lockout
  lockoutBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 4,
  },
  lockoutLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  lockoutTimer: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  lockoutHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255,255,255,0.4)',
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
});

import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PINKeypad from '../../components/common/PINKeypad';
import Button from '../../components/common/Button';
import { LockIcon, KeyIcon } from '../../components/common/Icons';
import { storePIN, storeSecurityQuestion } from '../../services/secureStorage';
import { validatePIN } from '../../utils/validation';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { SECURITY_CONFIG } from '../../constants/config';
import { validatePINStrength } from '../../utils/securityConfig';

type SetupStep = 'enter' | 'confirm' | 'security-question' | 'security-answer';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What is your favorite food?",
  "What was your childhood nickname?",
];


export default function SetPINScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.xl }
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <KeyIcon size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Security Question</Text>
            <Text style={styles.headerSubtitle}>Choose a question for PIN recovery</Text>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Select a security question:</Text>
            
            {SECURITY_QUESTIONS.map((question, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.questionOption,
                  pressed && styles.questionOptionPressed,
                ]}
                onPress={() => handleQuestionSelected(question)}
              >
                <Text style={styles.questionOptionText}>{question}</Text>
              </Pressable>
            ))}

            <View style={styles.backButtonContainer}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render security answer input
  if (step === 'security-answer') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.xl }
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <KeyIcon size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Security Answer</Text>
            <Text style={styles.headerSubtitle}>This will help you recover your PIN</Text>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>Your Question</Text>
              <Text style={styles.questionText}>{selectedQuestion}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your Answer</Text>
              <TextInput
                style={styles.textInput}
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
                placeholder="Enter your answer"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <View style={styles.actionButtons}>
              <Button
                title="Complete Setup"
                onPress={handleFinishSetup}
                loading={loading}
              />
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render PIN entry/confirmation
  const currentPin = step === 'enter' ? pin : confirmPin;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.iconContainer}>
          <LockIcon size={64} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>
          {step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {step === 'enter'
            ? `Enter a ${SECURITY_CONFIG.PIN_LENGTH_MIN}-${SECURITY_CONFIG.PIN_LENGTH_MAX} digit PIN to secure your app`
            : 'Re-enter your PIN to confirm'}
        </Text>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <View style={styles.pinDisplay}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < currentPin.length && styles.pinDotFilled,
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

        {step === 'confirm' && !loading && (
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Setting up your account...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.normal,
    paddingHorizontal: SPACING.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING['2xl'],
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
    paddingHorizontal: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  backButtonContainer: {
    marginTop: SPACING.xl,
  },
  // Security question styles
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  questionOption: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionOptionPressed: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  questionOptionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.normal,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  questionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    minHeight: 50,
  },
  actionButtons: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
});

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface PINKeypadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export default function PINKeypad({
  onPress,
  onDelete,
  onClear,
  disabled = false,
}: PINKeypadProps) {
  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '←'],
  ];

  const handlePress = (value: string) => {
    if (disabled) return;

    if (value === '←') {
      onDelete();
    } else if (value === 'C') {
      onClear();
    } else {
      onPress(value);
    }
  };

  return (
    <View style={styles.container}>
      {buttons.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((button) => (
            <Pressable
              key={button}
              style={({ pressed }) => [
                styles.button,
                pressed && !disabled && styles.buttonPressed,
                disabled && styles.buttonDisabled,
              ]}
              onPress={() => handlePress(button)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.buttonText,
                  (button === 'C' || button === '←') && styles.buttonTextAction,
                  disabled && styles.buttonTextDisabled,
                ]}
              >
                {button}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonPressed: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  buttonTextAction: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  buttonTextDisabled: {
    color: COLORS.textSecondary,
  },
});

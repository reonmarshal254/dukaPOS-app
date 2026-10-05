import { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING, BORDER_RADIUS } from '../../constants/spacing';

interface PINInputProps {
  length: number;
  value: string;
  onChange: (pin: string) => void;
  onComplete?: (pin: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

export default function PINInput({
  length,
  value,
  onChange,
  onComplete,
  error = false,
  autoFocus = true,
}: PINInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = (text: string) => {
    // Only allow digits and limit to length
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(cleaned);
  };

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Hidden input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        secureTextEntry
        style={styles.hiddenInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Visual PIN dots */}
      <Pressable style={styles.dotsContainer} onPress={handlePress}>
        {Array.from({ length }).map((_, index) => {
          const isFilled = index < value.length;
          const isActive = index === value.length && isFocused;
          
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                isActive && styles.dotActive,
                error && styles.dotError,
              ]}
            />
          );
        })}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dot: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dotActive: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  dotError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.badgeError,
  },
});

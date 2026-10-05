import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const BackArrowIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <View style={styles.backArrow}>
    <Text style={[styles.backArrowText, { color }]}>←</Text>
  </View>
);

export default function ScreenHeader({
  title,
  subtitle,
  icon,
  showBackButton = true,
  onBackPress,
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <BackArrowIcon />
          </TouchableOpacity>
        )}
        
        <View style={styles.headerCenter}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        {/* Spacer to keep title centered when back button is present */}
        {showBackButton && <View style={styles.spacer} />}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backArrow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowText: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  spacer: {
    width: 40, // Same width as back button to keep title centered
  },
});

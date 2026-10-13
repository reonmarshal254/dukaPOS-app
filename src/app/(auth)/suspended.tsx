import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LockIcon, PhoneIcon } from '../../components/common/Icons';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { checkAccountStatus } from '../../services/accountStatusService';
import Svg, { Path, Circle } from 'react-native-svg';

const SUPPORT_PHONE = '+254742041208';
const SUPPORT_WHATSAPP = '254742041208'; // Without + for WhatsApp

// Custom icon components
const BusinessIcon = ({ size = 20, color = COLORS.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 21H21M3 7L12 3L21 7M4 21V10M20 21V10M8 10V17M12 10V17M16 10V17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DeviceIcon = ({ size = 20, color = COLORS.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 2H17C17.5304 2 18.0391 2.21071 18.4142 2.58579C18.7893 2.96086 19 3.46957 19 4V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V4C5 3.46957 5.21071 2.96086 5.58579 2.58579C5.96086 2.21071 6.46957 2 7 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 18H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChipIcon = ({ size = 20, color = COLORS.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 2V6M15 2V6M9 18V22M15 18V22M2 9H6M2 15H6M18 9H22M18 15H22M6 6H18C18.5304 6 19.0391 6.21071 19.4142 6.58579C19.7893 6.96086 20 7.46957 20 8V16C20 16.5304 19.7893 17.0391 19.4142 17.4142C19.0391 17.7893 18.5304 18 18 18H6C5.46957 18 4.96086 17.7893 3.58579 17.4142C3.21071 17.0391 3 16.5304 3 16V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 6 6Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WhatsAppIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      fill={color}
    />
  </Svg>
);

const ChevronIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function SuspendedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [checking, setChecking] = useState(false);

  // Extract account details from params
  const businessName = params.businessName as string || 'Your Business';
  const deviceName = params.deviceName as string || 'Your Device';
  const deviceModel = params.deviceModel as string || '';
  const osName = params.osName as string || '';
  const deviceId = params.deviceId as string || '';

  const handleCall = async () => {
    try {
      const phoneUrl = `tel:${SUPPORT_PHONE}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      }
    } catch (error) {
      console.error('Error opening phone dialer:', error);
    }
  };

  const handleWhatsApp = async () => {
    try {
      const message = encodeURIComponent(
        `Hello, my DukaPOS account has been suspended.\n\n` +
        `Business: ${businessName}\n` +
        `Device: ${deviceName} ${deviceModel}\n` +
        `OS: ${osName}\n` +
        `Device ID: ${deviceId.slice(0, 16)}...`
      );
      const whatsappUrl = `whatsapp://send?phone=${SUPPORT_WHATSAPP}&text=${message}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
    }
  };

  const handleCheckStatus = async () => {
    if (!deviceId) return;
    
    setChecking(true);
    try {
      const status = await checkAccountStatus(deviceId);
      
      if (status && !status.suspended) {
        // Account is no longer suspended — go back to unlock
        router.replace('/(auth)/unlock');
      } else if (status && status.suspended) {
        // Still suspended
        alert('Your account is still suspended. Please contact support.');
      } else {
        // Offline or error
        alert('Unable to check status. Please ensure you have internet connection.');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      alert('Failed to check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FF6B6B', '#C92A2A']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <LockIcon size={64} color="#FFFFFF" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Account Suspended</Text>
          
          {/* Description */}
          <Text style={styles.description}>
            Your DukaPOS account has been temporarily suspended by our admin team.
            Please contact support to resolve this issue and regain access.
          </Text>

          {/* Account Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Your Account Details</Text>
            
            <View style={styles.detailRow}>
              <BusinessIcon size={20} color={COLORS.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Business</Text>
                <Text style={styles.detailValue}>{businessName}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <DeviceIcon size={20} color={COLORS.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Device</Text>
                <Text style={styles.detailValue}>
                  {deviceName}{deviceModel ? ` (${deviceModel})` : ''}
                </Text>
              </View>
            </View>

            {osName && (
              <View style={styles.detailRow}>
                <ChipIcon size={20} color={COLORS.textSecondary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Operating System</Text>
                  <Text style={styles.detailValue}>{osName}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Contact Support */}
          <Text style={styles.contactTitle}>Contact Support</Text>
          
          {/* Call Button */}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <PhoneIcon size={24} color="#FFFFFF" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Call Support</Text>
                <Text style={styles.buttonSubtitle}>{SUPPORT_PHONE}</Text>
              </View>
              <ChevronIcon size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* WhatsApp Button */}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#25D366', '#128C7E']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <WhatsAppIcon size={24} color="#FFFFFF" />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>WhatsApp Support</Text>
                <Text style={styles.buttonSubtitle}>{SUPPORT_PHONE}</Text>
              </View>
              <ChevronIcon size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Check Status Button */}
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleCheckStatus}
            disabled={checking}
            activeOpacity={0.7}
          >
            <Text style={styles.checkButtonText}>
              {checking ? 'Checking...' : 'Check Status Again'}
            </Text>
          </TouchableOpacity>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            Once your account is reactivated, you'll be able to access the app normally.
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * 1.5,
    marginBottom: SPACING.xl,
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  detailsTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  detailContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  contactTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  contactButton: {
    marginBottom: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  checkButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  footerNote: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
  },
});

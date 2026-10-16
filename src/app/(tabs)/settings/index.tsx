import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { useDevice } from '../../../hooks/useDevice';
import { getPermissionStatus } from '../../../services/notificationService';
import {
  SettingsIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  LockIcon,
  CloudSyncIcon,
  PackageIcon,
  AlertIcon,
} from '../../../components/common/Icons';

// ─── tiny helpers ──────────────────────────────────────────────────────────────

/** Shorten a UUID for display: show first 8 + last 4 chars */
function shortId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Device info row ───────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    flex: 1.4,
    textAlign: 'right',
  },
});

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: device, isLoading: deviceLoading } = useDevice();
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  // Refresh notification badge whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      getPermissionStatus().then(setNotifStatus);
    }, [])
  );

  const notifDot = notifStatus !== 'granted';

  const settingsGroups = [
    // PRICING_REMOVED: Subscription section removed
    // Uncomment below to restore pricing functionality
    /*
    {
      title: 'Subscription',
      items: [
        {
          id: 'pricing',
          label: 'Pricing & Licence',
          description: 'View plans, subscribe or renew',
          icon: ShieldCheckIcon,
          color: '#F59E0B',
          badge: null,
          action: async () => {
            const { getDeviceID } = await import('../../../services/secureStorage');
            const deviceId = await getDeviceID();
            router.push({
              pathname: '/(auth)/pricing',
              params: { deviceId: deviceId ?? '' },
            });
          },
        },
      ],
    },
    */
    {
      title: 'Security',
      items: [
        {
          id: 'change-pin',
          label: 'Change PIN',
          description: 'Update your security PIN',
          icon: LockIcon,
          color: COLORS.primary,
          badge: null,
          action: () => router.push('/(tabs)/settings/change-pin'),
        },
        {
          id: 'biometric',
          label: 'Biometric Authentication',
          description: 'Enable fingerprint or face unlock',
          icon: ShieldCheckIcon,
          color: COLORS.success,
          badge: null,
          action: () => router.push('/(tabs)/settings/biometric'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Business Profile',
          description: 'View your business information',
          icon: UserPlusIcon,
          color: COLORS.info,
          badge: null,
          action: () => router.push('/(tabs)/settings/business-profile'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          description: 'Stock alerts & daily reminders',
          icon: AlertIcon,
          color: '#F59E0B',
          badge: notifDot ? 'Off' : null,
          action: () => router.push('/(tabs)/settings/notifications'),
        },
        {
          id: 'reminders',
          label: 'Reminders',
          description: 'Manage your custom alerts',
          icon: AlertIcon,
          color: COLORS.primary,
          badge: null,
          action: () => router.push('/(tabs)/settings/reminders'),
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          id: 'sync',
          label: 'Sync Settings',
          description: 'Configure cloud synchronization',
          icon: CloudSyncIcon,
          color: COLORS.info,
          badge: null,
          action: () => Alert.alert('Coming Soon', 'Sync settings'),
        },
        {
          id: 'backup',
          label: 'Backup & Restore',
          description: 'Export or restore your data',
          icon: PackageIcon,
          color: COLORS.warning,
          badge: null,
          action: () => router.push('/(tabs)/settings/backup-restore'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerIconContainer}>
            <SettingsIcon size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your app preferences</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* ── Settings groups ──────────────────────────────────────────── */}
          {settingsGroups.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.settingsGroup}>
              <Text style={styles.groupTitle}>{group.title}</Text>

              <View style={styles.groupCard}>
                {group.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.settingRow,
                      itemIndex < group.items.length - 1 && styles.settingRowBorder,
                    ]}
                    onPress={item.action}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.settingIconContainer,
                        { backgroundColor: `${item.color}15` },
                      ]}
                    >
                      <item.icon size={22} color={item.color} />
                    </View>

                    <View style={styles.settingContent}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      <Text style={styles.settingDescription}>
                        {item.description}
                      </Text>
                    </View>

                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}

                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* ── System ───────────────────────────────────────────────────── */}
          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>System</Text>

            {/* Device info card */}
            <View style={styles.deviceCard}>
              <View style={styles.deviceCardHeader}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#7C3AED15' }]}>
                  <SettingsIcon size={22} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceCardTitle}>This Device</Text>
                  <Text style={styles.deviceCardSubtitle}>
                    {deviceLoading
                      ? 'Reading device info…'
                      : device?.isPhysicalDevice
                      ? 'Physical device'
                      : 'Simulator / Emulator'}
                  </Text>
                </View>
                {deviceLoading && (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                )}
              </View>

              {device && (
                <View style={styles.deviceRows}>
                  <InfoRow label="Device Name" value={device.deviceName} />
                  <InfoRow label="Model" value={device.deviceModel} />
                  <InfoRow
                    label="OS"
                    value={`${device.osName} ${device.osVersion}`}
                  />
                  <InfoRow
                    label="App Version"
                    value={`v${device.appVersion} (${device.appBuildNumber})`}
                  />
                  <InfoRow
                    label="Device ID"
                    value={shortId(device.deviceId)}
                  />
                  <View style={[infoStyles.row, { borderBottomWidth: 0 }]}>
                    <Text style={infoStyles.label}>Registered</Text>
                    <Text style={[infoStyles.value]}>
                      {formatDate(device.registeredAt)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Lock App */}
            <View style={[styles.groupCard, { marginTop: SPACING.sm }]}>
              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => {
                  Alert.alert(
                    'Lock App',
                    'Are you sure you want to lock the app?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Lock',
                        style: 'destructive',
                        onPress: () => router.replace('/(auth)/unlock'),
                      },
                    ]
                  );
                }}
              >
                <View
                  style={[
                    styles.settingIconContainer,
                    { backgroundColor: `${COLORS.error}15` },
                  ]}
                >
                  <LockIcon size={22} color={COLORS.error} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Lock App</Text>
                  <Text style={styles.settingDescription}>
                    Lock and secure the app
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── App version footer ───────────────────────────────────────── */}
          <View style={styles.footerContainer}>
            <LinearGradient
              colors={['#2563EB', '#1E40AF', '#1E3A8A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.footerGradient}
            >
              {/* Decorative circles */}
              <View style={styles.footerDecor1} />
              <View style={styles.footerDecor2} />
              
              {/* App info */}
              <View style={styles.footerContent}>
                <View style={styles.footerLogoContainer}>
                  <View style={styles.footerLogo}>
                    <Text style={styles.footerLogoText}>DP</Text>
                  </View>
                  <Text style={styles.footerAppName}>DukaPOS</Text>
                  <Text style={styles.footerVersion}>v1.0.0</Text>
                </View>

                <Text style={styles.footerTagline}>
                  Built with ❤️ for grocery & retail businesses
                </Text>

                <View style={styles.footerDivider} />

                <TouchableOpacity
                  style={styles.footerDevButton}
                  onPress={() => Linking.openURL('https://mcokoth-tech-flow.base44.app/')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerDevLabel}>Developed by</Text>
                  <Text style={styles.footerDevName}>MCOKOTH TECHNOLOGIES</Text>
                  
                </TouchableOpacity>

                <Text style={styles.footerCopyright}>
                  © {new Date().getFullYear()} DukaPOS. All rights reserved.
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['2xl'],
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },

  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },

  // Group
  settingsGroup: {
    marginBottom: SPACING.xl,
  },
  groupTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  settingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },

  // Device card
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  deviceCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  deviceCardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  deviceRows: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },

  // Version footer
  footerContainer: {
    marginTop: SPACING.xl,
    overflow: 'hidden',
  },
  footerGradient: {
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
  },
  footerDecor1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -30,
  },
  footerDecor2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -20,
    left: -20,
  },
  footerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  footerLogoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  footerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  footerLogoText: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  footerAppName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs / 2,
  },
  footerVersion: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
  },
  footerTagline: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  footerDivider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    marginBottom: SPACING.lg,
  },
  footerDevButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  footerDevLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.xs / 2,
  },
  footerDevName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs / 2,
  },
  footerDevIcon: {
    fontSize: 20,
  },
  footerCopyright: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  versionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  versionSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Badge
  badge: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.xs,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#92400E',
  },
});

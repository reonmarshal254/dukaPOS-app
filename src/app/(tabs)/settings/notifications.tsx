import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Switch, TouchableOpacity, Alert, ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import {
  requestNotificationPermission,
  getPermissionStatus,
  scheduleMorningReminder,
  cancelMorningReminder,
  isMorningReminderScheduled,
  isNotificationsEnabled,
  sendTestNotification,
} from '../../../services/notificationService';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({
  emoji, title, description, value, onToggle, disabled,
}: {
  emoji: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={t.row}>
      <View style={t.iconWrap}>
        <Text style={t.emoji}>{emoji}</Text>
      </View>
      <View style={t.content}>
        <Text style={t.title}>{title}</Text>
        <Text style={t.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
        thumbColor={value ? COLORS.primary : '#FFFFFF'}
      />
    </View>
  );
}

const t = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, gap: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 20 },
  content: { flex: 1 },
  title: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text, marginBottom: 2,
  },
  desc: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, lineHeight: 16 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [permStatus, setPermStatus] = useState<'granted' | 'denied' | 'undetermined' | 'loading'>('loading');
  const [morningEnabled, setMorningEnabled] = useState(false);
  const [stockAlertsEnabled, setStockAlertsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Re-read state every time screen focuses (user may have changed system settings)
  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [])
  );

  const loadState = async () => {
    const status = await getPermissionStatus();
    setPermStatus(status);
    if (status === 'granted') {
      const scheduled = await isMorningReminderScheduled();
      setMorningEnabled(scheduled);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      await loadState();
    } else {
      Alert.alert(
        'Permission Denied',
        'Notifications are blocked. Please enable them in your device Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleMorningToggle = async (enabled: boolean) => {
    if (permStatus !== 'granted') {
      await handleRequestPermission();
      return;
    }
    setSaving(true);
    try {
      if (enabled) {
        await scheduleMorningReminder();
        setMorningEnabled(true);
        Alert.alert('✅ Reminder Set', 'You\'ll get a morning nudge every day at 7:00 AM.');
      } else {
        await cancelMorningReminder();
        setMorningEnabled(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStockAlertsToggle = (enabled: boolean) => {
    if (permStatus !== 'granted') {
      handleRequestPermission();
      return;
    }
    setStockAlertsEnabled(enabled);
    // Persisting this preference could go to SecureStore; for now it's in-memory
    // and low-stock check in useProducts respects this via notificationService.
  };

  const permGranted = permStatus === 'granted';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={s.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission status banner */}
        {permStatus === 'loading' ? (
          <View style={s.permCard}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : !permGranted ? (
          <View style={[s.permCard, s.permCardDenied]}>
            <Text style={s.permIcon}>🔔</Text>
            <View style={s.permContent}>
              <Text style={s.permTitle}>Notifications are off</Text>
              <Text style={s.permDesc}>
                Allow DukaPOS to send you stock alerts and daily reminders.
              </Text>
            </View>
            <TouchableOpacity style={s.permBtn} onPress={handleRequestPermission} activeOpacity={0.8}>
              <Text style={s.permBtnText}>Enable</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.permCard, s.permCardGranted]}>
            <Text style={s.permIcon}>✅</Text>
            <Text style={s.permGrantedText}>Notifications are enabled</Text>
          </View>
        )}

        {/* Alerts config */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Alert Types</Text>

          <ToggleRow
            emoji="⚠️"
            title="Low Stock Alerts"
            description="Get notified immediately when a product drops below its minimum stock level"
            value={stockAlertsEnabled && permGranted}
            onToggle={handleStockAlertsToggle}
            disabled={!permGranted || saving}
          />

          <View style={[t.row, { borderBottomWidth: 0 }]}>
            <View style={t.iconWrap}>
              <Text style={t.emoji}>🌅</Text>
            </View>
            <View style={t.content}>
              <Text style={t.title}>Morning Reminder</Text>
              <Text style={t.desc}>Daily reminder at 7:00 AM to open your shop and check stock</Text>
            </View>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Switch
                value={morningEnabled && permGranted}
                onValueChange={handleMorningToggle}
                disabled={!permGranted || saving}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                thumbColor={morningEnabled ? COLORS.primary : '#FFFFFF'}
              />
            )}
          </View>
        </View>

        {/* Preview / test */}
        {permGranted && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Test Notifications</Text>
            <Text style={s.testDesc}>
              Send a sample notification to make sure everything is working correctly.
            </Text>
            <TouchableOpacity
              style={s.testBtn}
              activeOpacity={0.8}
              onPress={async () => {
                const sent = await sendTestNotification();
                if (sent) {
                  Alert.alert('Sent!', 'Check your notification bar.');
                } else {
                  Alert.alert('Not available', 'Notifications require a development build.');
                }
              }}
            >
              <Text style={s.testBtnText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={s.infoCard}>
          <Text style={s.infoIcon}>💡</Text>
          <Text style={s.infoText}>
            Notifications appear in your device's notification bar, just like WhatsApp messages.
            You can manage DukaPOS notification settings in your phone's Settings at any time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: { padding: SPACING.xs },
  backText: { fontSize: 22, color: '#FFFFFF' },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF',
  },
  scroll: { padding: SPACING.lg },

  permCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, marginBottom: SPACING.md,
    gap: SPACING.sm, ...SHADOWS.sm,
  },
  permCardDenied: { borderWidth: 1, borderColor: '#FED7AA', backgroundColor: '#FFF7ED' },
  permCardGranted: { borderWidth: 1, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  permIcon: { fontSize: 24 },
  permContent: { flex: 1 },
  permTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text, marginBottom: 2,
  },
  permDesc: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, lineHeight: 16 },
  permBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  permBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF',
  },
  permGrantedText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold, color: '#166534', flex: 1,
  },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: SPACING.md,
  },

  testDesc: {
    fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary,
    lineHeight: 20, marginBottom: SPACING.md,
  },
  testBtn: {
    backgroundColor: '#EFF6FF', borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  testBtnText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.primary,
  },

  infoCard: {
    flexDirection: 'row', backgroundColor: '#EFF6FF',
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    gap: SPACING.sm, borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: '#1E40AF', lineHeight: 20 },
});

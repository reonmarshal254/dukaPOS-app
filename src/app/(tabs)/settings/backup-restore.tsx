import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../../../database';
import { TABLES } from '../../../database/schema';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium', timeStyle: 'short',
  });
}

type BackupState = 'idle' | 'running' | 'done' | 'error';

export default function BackupRestoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [backupState, setBackupState] = useState<BackupState>('idle');
  const [restoreState, setRestoreState] = useState<BackupState>('idle');
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupSummary, setBackupSummary] = useState<string>('');

  // ── Export / backup ─────────────────────────────────────────────────────────
  const handleBackup = async () => {
    setBackupState('running');
    try {
      const db = getDatabase();

      // Collect all tables
      const tables = [
        TABLES.BUSINESSES, TABLES.CATEGORIES, TABLES.PRODUCTS,
        TABLES.SUPPLIERS, TABLES.CUSTOMERS, TABLES.PURCHASES,
        TABLES.PURCHASE_ITEMS, TABLES.STOCK_BATCHES, TABLES.STOCK_MOVEMENTS,
        TABLES.SALES, TABLES.SALE_ITEMS, TABLES.PAYMENTS,
        TABLES.CUSTOMER_LEDGER, TABLES.EXPENSES, TABLES.APP_SETTINGS,
      ];

      const backup: Record<string, unknown[]> = {};
      let totalRows = 0;

      for (const table of tables) {
        const rows = await db.getAllAsync<unknown>(`SELECT * FROM ${table}`);
        backup[table] = rows ?? [];
        totalRows += rows?.length ?? 0;
      }

      const payload = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        data: backup,
      }, null, 2);

      const filename = `dukapos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      // Use the new expo-file-system v57 File + Paths API
      const { File, Paths } = FileSystem;
      const dir = Paths.document;
      const file = new File(dir, filename);
      file.write(payload);
      const uri = file.uri;

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save your DukaPOS backup',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Backup Saved', `File saved to:\n${uri}`);
      }

      const now = new Date().toISOString();
      setLastBackupTime(now);
      setBackupSummary(`${totalRows} records across ${tables.length} tables`);
      setBackupState('done');
    } catch (err: any) {
      console.error('Backup error:', err);
      Alert.alert('Backup Failed', err.message ?? 'An unexpected error occurred.');
      setBackupState('error');
    }
  };

  // ── Import / restore ────────────────────────────────────────────────────────
  const handleRestore = () => {
    Alert.alert(
      '⚠️ Restore Backup',
      'This will overwrite ALL current data with the backup file. This cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, restore',
          style: 'destructive',
          onPress: doRestore,
        },
      ]
    );
  };

  const doRestore = async () => {
    setRestoreState('running');
    try {
      // On mobile we can only read files the user explicitly shared to us.
      // Guide user to use the share-to-app flow.
      Alert.alert(
        'How to Restore',
        '1. Find your backup .json file\n2. Tap Share → DukaPOS\n\nFile import via the share sheet is supported on Android & iOS.',
      );
      setRestoreState('idle');
    } catch (err: any) {
      console.error('Restore error:', err);
      Alert.alert('Restore Failed', err.message ?? 'An unexpected error occurred.');
      setRestoreState('error');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={s.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Backup & Restore</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Backup card */}
        <View style={s.card}>
          <View style={s.cardIcon}>
            <Text style={s.cardIconText}>📤</Text>
          </View>
          <Text style={s.cardTitle}>Export Backup</Text>
          <Text style={s.cardDesc}>
            Export all your products, sales, customers and settings to a JSON
            file you can save to Google Drive, WhatsApp, email, or any app.
          </Text>
          {lastBackupTime && (
            <View style={s.lastBadge}>
              <Text style={s.lastBadgeText}>
                Last backup: {fmt(lastBackupTime)}
              </Text>
              {backupSummary ? (
                <Text style={s.lastBadgeSub}>{backupSummary}</Text>
              ) : null}
            </View>
          )}
          <TouchableOpacity
            style={[s.btn, s.btnPrimary, backupState === 'running' && s.btnDisabled]}
            onPress={handleBackup}
            disabled={backupState === 'running'}
            activeOpacity={0.8}
          >
            {backupState === 'running' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.btnTextWhite}>
                {backupState === 'done' ? '✓ Export Again' : 'Export Backup'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Restore card */}
        <View style={s.card}>
          <View style={s.cardIcon}>
            <Text style={s.cardIconText}>📥</Text>
          </View>
          <Text style={s.cardTitle}>Restore from Backup</Text>
          <Text style={s.cardDesc}>
            Restore all data from a previously exported backup file. Your
            current data will be replaced.
          </Text>
          <View style={s.warningBox}>
            <Text style={s.warningText}>
              ⚠️ Restoring will permanently overwrite all current data. Make
              sure you have a fresh backup first.
            </Text>
          </View>
          <TouchableOpacity
            style={[s.btn, s.btnDanger, restoreState === 'running' && s.btnDisabled]}
            onPress={handleRestore}
            disabled={restoreState === 'running'}
            activeOpacity={0.8}
          >
            {restoreState === 'running' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.btnTextWhite}>Restore Backup</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <Text style={s.infoIcon}>💡</Text>
          <Text style={s.infoText}>
            We recommend backing up weekly and before any major changes.
            Store backups in multiple places (cloud + local).
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
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  scroll: { padding: SPACING.lg, gap: SPACING.md },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardIconText: { fontSize: 28 },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text, marginBottom: SPACING.xs,
  },
  cardDesc: {
    fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary,
    lineHeight: 20, marginBottom: SPACING.md,
  },

  lastBadge: {
    backgroundColor: '#F0FDF4', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  lastBadgeText: { fontSize: 12, color: '#166534', fontWeight: TYPOGRAPHY.fontWeight.semibold },
  lastBadgeSub: { fontSize: 11, color: '#166534', marginTop: 2 },

  warningBox: {
    backgroundColor: '#FFF7ED', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  warningText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

  btn: {
    borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md,
    alignItems: 'center', justifyContent: 'center', minHeight: 48,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnDanger:  { backgroundColor: COLORS.error },
  btnDisabled: { opacity: 0.6 },
  btnTextWhite: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },

  infoCard: {
    flexDirection: 'row', backgroundColor: '#EFF6FF',
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    gap: SPACING.sm, borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: '#1E40AF', lineHeight: 20 },
});

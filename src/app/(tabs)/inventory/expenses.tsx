import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Pressable, Dimensions,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useExpenses, useCreateExpense, useDeleteExpense } from '../../../hooks/useExpenses';
import { formatCurrency, toMinorUnits, toMajorUnits } from '../../../utils/currency';
import { PaymentMethod } from '../../../types';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';

const { width } = Dimensions.get('window');

// ─── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'All',         value: '' },
  { label: 'Rent',        value: 'Rent',        emoji: '🏠' },
  { label: 'Utilities',   value: 'Utilities',   emoji: '💡' },
  { label: 'Salaries',    value: 'Salaries',    emoji: '👥' },
  { label: 'Stock',       value: 'Stock',       emoji: '📦' },
  { label: 'Transport',   value: 'Transport',   emoji: '🚗' },
  { label: 'Marketing',   value: 'Marketing',   emoji: '📢' },
  { label: 'Maintenance', value: 'Maintenance', emoji: '🔧' },
  { label: 'Other',       value: 'Other',       emoji: '📋' },
];

const PAYMENT_METHODS = [
  { label: 'Cash',    value: PaymentMethod.CASH },
  { label: 'M-Pesa',  value: PaymentMethod.MOBILE_MONEY },
];

function categoryEmoji(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.emoji ?? '📋';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Add Expense Modal ─────────────────────────────────────────────────────────
function AddExpenseModal({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const createExpense = useCreateExpense();

  const [category,    setCategory]    = useState('Other');
  const [description, setDescription] = useState('');
  const [amount,      setAmount]      = useState('');
  const [method,      setMethod]      = useState<PaymentMethod>(PaymentMethod.CASH);
  const [notes,       setNotes]       = useState('');

  const reset = () => {
    setCategory('Other'); setDescription(''); setAmount('');
    setMethod(PaymentMethod.CASH); setNotes('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!description.trim()) { Alert.alert('Required', 'Please enter a description'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid', 'Please enter a valid amount'); return; }

    try {
      await createExpense.mutateAsync({
        category,
        description: description.trim(),
        amount: toMinorUnits(amt),
        paymentMethod: method,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save expense');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={m.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={m.kavWrapper}
      >
        <View style={[m.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <View style={m.handle} />

          <View style={m.header}>
            <View>
              <Text style={m.title}>Add Expense</Text>
              <Text style={m.subtitle}>Record a business expense</Text>
            </View>
            <TouchableOpacity style={m.closeBtn} onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={m.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Category */}
            <Text style={m.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
                {CATEGORIES.filter(c => c.value).map(c => (
                  <TouchableOpacity
                    key={c.value}
                    style={[m.catChip, category === c.value && m.catChipActive]}
                    onPress={() => setCategory(c.value)}
                  >
                    <Text style={[m.catChipText, category === c.value && m.catChipTextActive]}>
                      {c.emoji} {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Description */}
            <Text style={m.label}>Description <Text style={{ color: COLORS.error }}>*</Text></Text>
            <TextInput
              style={m.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Electricity bill for October"
              placeholderTextColor={COLORS.textSecondary}
            />

            {/* Amount */}
            <Text style={m.label}>Amount (KES) <Text style={{ color: COLORS.error }}>*</Text></Text>
            <TextInput
              style={m.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="decimal-pad"
            />

            {/* Payment method */}
            <Text style={m.label}>Payment Method</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.md }}>
              {PAYMENT_METHODS.map(pm => (
                <TouchableOpacity
                  key={pm.value}
                  style={[m.methodBtn, method === pm.value && m.methodBtnActive]}
                  onPress={() => setMethod(pm.value)}
                >
                  <Text style={[m.methodBtnText, method === pm.value && m.methodBtnTextActive]}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={m.label}>Notes (optional)</Text>
            <TextInput
              style={[m.input, { minHeight: 64, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional details…"
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />

            {/* Save */}
            <TouchableOpacity
              style={[m.saveBtn, createExpense.isPending && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={createExpense.isPending}
              activeOpacity={0.85}
            >
              <Text style={m.saveBtnText}>
                {createExpense.isPending ? 'Saving…' : 'Save Expense'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  kavWrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, ...SHADOWS.lg },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.divider, alignSelf: 'center', marginBottom: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  title: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  closeTxt: { fontSize: 13, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.bold },
  label: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.text, marginBottom: SPACING.md },
  catChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text, fontWeight: TYPOGRAPHY.fontWeight.medium },
  catChipTextActive: { color: '#FFFFFF', fontWeight: TYPOGRAPHY.fontWeight.semibold },
  methodBtn: { flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.surface },
  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  methodBtnText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text },
  methodBtnTextActive: { color: '#FFFFFF' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.md },
  saveBtnText: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ExpensesScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [addVisible,  setAddVisible]  = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  const { data: expenses = [], refetch } = useExpenses(
    selectedCategory ? { category: selectedCategory } : undefined
  );
  const deleteExpense = useDeleteExpense();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: string, description: string) => {
    Alert.alert('Delete Expense', `Delete "${description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense.mutate(id) },
    ]);
  };

  // Summary totals
  const totalAmount = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const cashTotal  = useMemo(() => expenses.filter(e => e.paymentMethod === PaymentMethod.CASH).reduce((s, e) => s + e.amount, 0), [expenses]);
  const mpesaTotal = useMemo(() => expenses.filter(e => e.paymentMethod === PaymentMethod.MOBILE_MONEY).reduce((s, e) => s + e.amount, 0), [expenses]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof expenses>();
    expenses.forEach(e => {
      const key = fmtDate(e.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [expenses]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={s.header}
      >
        <View style={s.headerDecor} />
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Expenses</Text>
            <Text style={s.headerSub}>Track your business costs</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setAddVisible(true)} activeOpacity={0.8}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Summary row */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Total</Text>
            <Text style={s.summaryValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Cash</Text>
            <Text style={s.summaryValue}>{formatCurrency(cashTotal)}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>M-Pesa</Text>
            <Text style={s.summaryValue}>{formatCurrency(mpesaTotal)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Category filter chips */}
      <View style={s.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.value}
              style={[s.filterChip, selectedCategory === c.value && s.filterChipActive]}
              onPress={() => setSelectedCategory(c.value)}
            >
              <Text style={[s.filterChipText, selectedCategory === c.value && s.filterChipTextActive]}>
                {c.emoji ? `${c.emoji} ` : ''}{c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Expense list */}
      <ScrollView
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {expenses.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💸</Text>
            <Text style={s.emptyTitle}>No expenses yet</Text>
            <Text style={s.emptyText}>Tap "+ Add" to record your first business expense</Text>
          </View>
        ) : (
          grouped.map(([date, items]) => (
            <View key={date}>
              {/* Date header */}
              <View style={s.dateHeader}>
                <Text style={s.dateLabel}>{date}</Text>
                <Text style={s.dateTotalLabel}>
                  {formatCurrency(items.reduce((s, e) => s + e.amount, 0))}
                </Text>
              </View>

              {/* Items */}
              {items.map((expense, idx) => (
                <TouchableOpacity
                  key={expense.id}
                  style={[s.expenseCard, idx === items.length - 1 && { marginBottom: SPACING.sm }]}
                  onLongPress={() => handleDelete(expense.id, expense.description)}
                  activeOpacity={0.85}
                >
                  <View style={s.expenseIcon}>
                    <Text style={{ fontSize: 22 }}>{categoryEmoji(expense.category)}</Text>
                  </View>
                  <View style={s.expenseInfo}>
                    <Text style={s.expenseDescription} numberOfLines={1}>{expense.description}</Text>
                    <View style={s.expenseMeta}>
                      <View style={s.categoryPill}>
                        <Text style={s.categoryPillText}>{expense.category}</Text>
                      </View>
                      <Text style={s.expenseMethod}>
                        {expense.paymentMethod === PaymentMethod.CASH ? '💵 Cash' : '📱 M-Pesa'}
                      </Text>
                    </View>
                    {expense.notes ? <Text style={s.expenseNotes} numberOfLines={1}>{expense.notes}</Text> : null}
                  </View>
                  <Text style={s.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <AddExpenseModal visible={addVisible} onClose={() => setAddVisible(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.lg, overflow: 'hidden' },
  headerDecor: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  backBtn: { padding: SPACING.xs },
  backText: { fontSize: 22, color: '#FFFFFF' },
  headerTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },
  headerSub: { fontSize: TYPOGRAPHY.fontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },

  summaryRow: { flexDirection: 'row', gap: SPACING.sm },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: TYPOGRAPHY.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  summaryValue: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: '#FFFFFF' },

  filterWrap: { backgroundColor: '#FFFFFF', paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  filterScroll: { paddingHorizontal: SPACING.lg, gap: 8 },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: TYPOGRAPHY.fontWeight.semibold },

  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs, marginTop: SPACING.xs },
  dateLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateTotalLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary },

  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.xs, ...SHADOWS.sm, gap: SPACING.md },
  expenseIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1 },
  expenseDescription: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text, marginBottom: 4 },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  categoryPill: { backgroundColor: COLORS.badgeInfo, borderRadius: BORDER_RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  categoryPillText: { fontSize: 10, color: COLORS.info, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  expenseMethod: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary },
  expenseNotes: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, marginTop: 2 },
  expenseAmount: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.error },

  empty: { alignItems: 'center', paddingTop: SPACING['3xl'] },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text, marginBottom: SPACING.sm },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
});

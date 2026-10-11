import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useSupplierWithSupplies,
  useCreateSupply,
  useDeleteSupply,
} from '../../../hooks/useSuppliers';
import { formatCurrency, toMinorUnits } from '../../../utils/currency';
import { StarIcon, PhoneIcon, CalendarIcon, EditIcon, TrashIcon } from '../../../components/common/Icons';
import { COLORS } from '../../../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SupplierDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [addSupplyVisible, setAddSupplyVisible] = useState(false);

  const { data: supplier, isLoading } = useSupplierWithSupplies(id || '');
  const createSupply = useCreateSupply();
  const deleteSupply = useDeleteSupply();

  const handleCall = () => {
    if (!supplier?.phone) {
      Alert.alert('No Phone', 'This supplier has no phone number');
      return;
    }
    Linking.openURL(`tel:${supplier.phone}`);
  };

  const handleEmail = () => {
    if (!supplier?.email) {
      Alert.alert('No Email', 'This supplier has no email address');
      return;
    }
    Linking.openURL(`mailto:${supplier.email}`);
  };

  const handleDeleteSupply = (supplyId: string, productName: string) => {
    Alert.alert('Delete Supply', `Delete supply record for "${productName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSupply.mutate({ id: supplyId, supplierId: id || '' }),
      },
    ]);
  };

  const renderStars = (rating: number = 0) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            size={16}
            color={star <= rating ? COLORS.warning : COLORS.border}
            filled={star <= rating}
          />
        ))}
      </View>
    );
  };

  if (isLoading || !supplier) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.supplierName}>{supplier.name}</Text>
            {renderStars(supplier.rating)}
          </View>
        </View>

        {/* Contact buttons */}
        <View style={styles.contactRow}>
          {supplier.phone && (
            <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
              <PhoneIcon size={18} color="#FFFFFF" />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>
          )}
          {supplier.email && (
            <TouchableOpacity style={styles.contactBtn} onPress={handleEmail}>
              <Text style={{ fontSize: 16 }}>✉️</Text>
              <Text style={styles.contactBtnText}>Email</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supplier Details</Text>
          {supplier.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{supplier.phone}</Text>
            </View>
          )}
          {supplier.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{supplier.email}</Text>
            </View>
          )}
          {supplier.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{supplier.address}</Text>
            </View>
          )}
          {supplier.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{supplier.notes}</Text>
            </View>
          )}
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supply Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Supplied</Text>
              <Text style={styles.statValue}>
                {formatCurrency(supplier.totalSupplied)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Supplies</Text>
              <Text style={styles.statValue}>{supplier.supplies.length}</Text>
            </View>
          </View>
        </View>

        {/* Supply History */}
        <View style={styles.card}>
          <View style={styles.supplyHeader}>
            <Text style={styles.cardTitle}>Supply History</Text>
            <TouchableOpacity
              style={styles.addSupplyBtn}
              onPress={() => setAddSupplyVisible(true)}
            >
              <Text style={styles.addSupplyText}>+ Add Supply</Text>
            </TouchableOpacity>
          </View>

          {supplier.supplies.length === 0 ? (
            <Text style={styles.noSupplies}>No supply records yet</Text>
          ) : (
            supplier.supplies.map((supply) => (
              <TouchableOpacity
                key={supply.id}
                style={styles.supplyItem}
                onLongPress={() => handleDeleteSupply(supply.id, supply.productName)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplyProduct}>{supply.productName}</Text>
                  <Text style={styles.supplyDetails}>
                    {supply.quantity} {supply.unit} • {new Date(supply.supplyDate).toLocaleDateString()}
                  </Text>
                  {supply.notes && (
                    <Text style={styles.supplyNotes}>{supply.notes}</Text>
                  )}
                </View>
                <Text style={styles.supplyAmount}>{formatCurrency(supply.amount)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <AddSupplyModal
        visible={addSupplyVisible}
        onClose={() => setAddSupplyVisible(false)}
        supplierId={id || ''}
        onSubmit={createSupply}
      />
    </SafeAreaView>
  );
}

// Add Supply Modal Component
function AddSupplyModal({
  visible,
  onClose,
  supplierId,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  supplierId: string;
  onSubmit: any;
}) {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [amount, setAmount] = useState('');
  const [supplyDate, setSupplyDate] = useState(new Date().toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  const reset = () => {
    setProductName('');
    setQuantity('');
    setUnit('pcs');
    setAmount('');
    setSupplyDate(new Date().toISOString());
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      Alert.alert('Required', 'Please enter product name');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid', 'Please enter valid quantity');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Invalid', 'Please enter valid amount');
      return;
    }

    try {
      await onSubmit.mutateAsync({
        supplierId,
        productName: productName.trim(),
        quantity: qty,
        unit: unit.trim(),
        amount: toMinorUnits(amt),
        supplyDate,
        notes: notes.trim() || undefined,
      });
      reset();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add supply');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Supply Record</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={styles.inputLabel}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g., Coca Cola 500ml"
            />

            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Unit *</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="pcs"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Amount (KES) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Supply Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{new Date(supplyDate).toLocaleDateString()}</Text>
              <CalendarIcon size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(supplyDate)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_: any, selectedDate?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setSupplyDate(selectedDate.toISOString());
                  }
                }}
              />
            )}

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes..."
              multiline
            />

            <TouchableOpacity
              style={[styles.submitBtn, onSubmit.isPending && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={onSubmit.isPending}
            >
              <Text style={styles.submitBtnText}>
                {onSubmit.isPending ? 'Saving...' : 'Add Supply'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loading: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.textSecondary },

  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  backBtn: { padding: SPACING.xs },
  backText: { fontSize: 22, color: '#FFFFFF' },
  supplierName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  starsRow: { flexDirection: 'row', gap: 2 },

  contactRow: { flexDirection: 'row', gap: SPACING.sm },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  contactBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#FFFFFF',
  },

  content: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  detailRow: { marginBottom: SPACING.sm },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },

  statsRow: { flexDirection: 'row', gap: SPACING.md },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },

  supplyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addSupplyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  addSupplyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },

  noSupplies: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    paddingVertical: SPACING.lg,
  },

  supplyItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  supplyProduct: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  supplyDetails: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  supplyNotes: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  supplyAmount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
});

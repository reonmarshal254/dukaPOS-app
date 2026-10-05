import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { executeTransaction } from '../../database';
import { TABLES } from '../../database/schema';
import { generateUUID } from '../../utils/uuid';
import { getCurrentDateTime } from '../../utils/datetime';
import { storeBusinessID } from '../../services/secureStorage';
import { recordInstallTimestamp } from '../../services/secureStorage';
import { useForceDeviceRefresh } from '../../hooks/useDevice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { validateRequired, validatePhone } from '../../utils/validation';

interface BusinessFormData {
  businessName: string;
  ownerName: string;
  phone: string;
  location: string;
  logoUri?: string;
}

export default function SetupScreen() {
  const router = useRouter();
  const forceDeviceRefresh = useForceDeviceRefresh();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    ownerName: '',
    phone: '',
    location: '',
  });
  const [errors, setErrors] = useState<Partial<BusinessFormData>>({});

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to upload a logo'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, logoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BusinessFormData> = {};

    if (!validateRequired(formData.businessName)) {
      newErrors.businessName = 'Business name is required';
    }

    if (!validateRequired(formData.ownerName)) {
      newErrors.ownerName = 'Owner name is required';
    }

    if (!validateRequired(formData.phone)) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!validateRequired(formData.location)) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Double-check connectivity before writing (welcome screen already checked
    // but setup can take time — user might have gone offline)
    try {
      const res = await fetch('https://dukapos-gjfx.onrender.com/health', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok && res.status >= 500) throw new Error('server');
    } catch {
      Alert.alert(
        'No Internet',
        'An internet connection is required to complete setup so your business is registered. Please reconnect and try again.'
      );
      return;
    }

    setLoading(true);

    try {
      const businessId = generateUUID();
      const now = getCurrentDateTime();

      await executeTransaction(async (db) => {
        // Insert business
        await db.runAsync(
          `INSERT INTO ${TABLES.BUSINESSES} (
            id, name, owner_name, phone, location, logo_url, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            businessId,
            formData.businessName,
            formData.ownerName,
            formData.phone,
            formData.location,
            formData.logoUri || null,
            now,
            now,
          ]
        );

        // Store business ID securely
        await storeBusinessID(businessId);
      });

      // Record the install timestamp — used for 24h grace period
      await recordInstallTimestamp();

      // Trigger device registration to admin backend now that business exists
      forceDeviceRefresh();

      // Navigate to PIN setup
      router.replace('/(auth)/set-pin');
    } catch (error) {
      console.error('Error registering business:', error);
      Alert.alert('Error', 'Failed to register business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Business Setup</Text>
            <Text style={styles.subtitle}>
              Let's get started by setting up your business information
            </Text>
          </View>

          <View style={styles.form}>
            {/* Logo Upload */}
            <View style={styles.logoSection}>
              <Text style={styles.logoLabel}>Business Logo (Optional)</Text>
              <TouchableOpacity
                style={styles.logoButton}
                onPress={handlePickImage}
              >
                {formData.logoUri ? (
                  <Text style={styles.logoText}>Logo Selected ✓</Text>
                ) : (
                  <Text style={styles.logoText}>📷 Upload Logo</Text>
                )}
              </TouchableOpacity>
            </View>

            <Input
              label="Business Name"
              placeholder="e.g., Mama Grace Shop"
              value={formData.businessName}
              onChangeText={(text) =>
                setFormData({ ...formData, businessName: text })
              }
              error={errors.businessName}
              required
            />

            <Input
              label="Owner Name"
              placeholder="Your full name"
              value={formData.ownerName}
              onChangeText={(text) =>
                setFormData({ ...formData, ownerName: text })
              }
              error={errors.ownerName}
              required
            />

            <Input
              label="Phone Number"
              placeholder="07XX XXX XXX"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              error={errors.phone}
              required
            />

            <Input
              label="Business Location"
              placeholder="e.g., Nairobi, Westlands"
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
              error={errors.location}
              required
            />
          </View>

          <View style={styles.footer}>
            <Button
              title="Continue"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.normal,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  logoSection: {
    marginBottom: SPACING.lg,
  },
  logoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  logoButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: SPACING.lg,
  },
});

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import {
  HomeIcon,
  PackageIcon,
  ShoppingBagIcon,
  ChartIcon,
  SettingsIcon,
} from '../common/Icons';

// ─── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { name: 'index',    href: '/(tabs)',          label: 'Home',     Icon: HomeIcon },
  { name: 'products', href: '/(tabs)/products', label: 'Products', Icon: PackageIcon },
  { name: 'pos',      href: '/(tabs)/pos',      label: 'POS',      Icon: ShoppingBagIcon },
  { name: 'reports',  href: '/(tabs)/reports',  label: 'Reports',  Icon: ChartIcon },
  { name: 'settings', href: '/(tabs)/settings', label: 'Settings', Icon: SettingsIcon },
] as const;

const BAR_HEIGHT = 64;
const CENTER_SIZE = 54;

export default function CustomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab from current pathname
  const getActiveTab = () => {
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index') return 'index';
    if (pathname.startsWith('/(tabs)/pos'))      return 'pos';
    if (pathname.startsWith('/(tabs)/products')) return 'products';
    if (pathname.startsWith('/(tabs)/reports'))  return 'reports';
    if (pathname.startsWith('/(tabs)/settings')) return 'settings';
    return 'index';
  };

  const activeTab = getActiveTab();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isFocused = activeTab === tab.name;
          const isCenter = tab.name === 'pos';

          const onPress = () => {
            if (!isFocused) router.push(tab.href as any);
          };

          // ── Center POS button ──────────────────────────────────────────
          if (isCenter) {
            return (
              <Pressable
                key={tab.name}
                onPress={onPress}
                style={styles.centerWrap}
                accessibilityRole="button"
                accessibilityLabel="POS"
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.centerBtn, isFocused && styles.centerBtnActive]}
                >
                  <ShoppingBagIcon size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.label, isFocused && styles.labelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          }

          // ── Regular tab ────────────────────────────────────────────────
          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              {isFocused && <View style={styles.indicator} />}
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <tab.Icon
                  size={20}
                  color={isFocused ? COLORS.primary : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  // Regular tab
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_HEIGHT,
    gap: 3,
    position: 'relative',
  },
  tabPressed: { opacity: 0.6 },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#EFF6FF',
  },
  label: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Center POS button
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(CENTER_SIZE / 2),
    gap: 3,
  },
  centerBtn: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  centerBtnActive: {
    shadowOpacity: 0.6,
    elevation: 14,
  },
});

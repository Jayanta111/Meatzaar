import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import api from '@/lib/api';

const MENU_ITEMS = [
  { icon: '🏪', label: 'Shop Settings', subtitle: 'Name, timing, description', route: '/edit-profile' },
  { icon: '📍', label: 'Shop Location', subtitle: 'Update your address', route: '/edit-profile' },
  { icon: '💳', label: 'Bank Details', subtitle: 'For payouts & settlements', route: '' },
  { icon: '📊', label: 'Analytics', subtitle: 'Detailed sales reports', route: '' },
  { icon: '🔔', label: 'Notifications', subtitle: 'Order & payout alerts', route: '/notifications' },
  { icon: '📞', label: 'Help & Support', subtitle: 'FAQ, chat, call us', route: '/support' },
];

export default function VendorProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = React.useState({ totalOrders: 0, totalEarnings: 0, rating: 0 });

  React.useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <Text style={[styles.title, { color: theme.text }]}>Vendor Profile</Text>
        </View>

        {/* Vendor Card */}
        <View style={[styles.vendorCard, { backgroundColor: theme.primary }]}>
          <View style={styles.vendorAvatar}>
            {user?.avatarUrl ? (
               <Text style={styles.vendorAvatarText}>📸</Text> // In a real app, use Image component
            ) : (
               <Text style={styles.vendorAvatarText}>
                 {user?.shopName ? user.shopName.charAt(0).toUpperCase() : '🏪'}
               </Text>
            )}
          </View>
          <Text style={styles.vendorShopName}>{user?.shopName || 'Your Shop'}</Text>
          <Text style={styles.vendorOwner}>{user?.name || 'Vendor'}</Text>
          <View style={styles.vendorBadge}>
            <Text style={styles.vendorBadgeText}>✅ Verified Vendor</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.editBtn}>
            <Text style={[styles.editBtnText, { color: theme.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Card */}
        <View style={[styles.subCard, { backgroundColor: theme.cardBackground, borderColor: theme.accent }]}>
          <View style={styles.subHeader}>
            <Text style={styles.subEmoji}>⭐</Text>
            <View>
              <Text style={[styles.subTitle, { color: theme.text }]}>Free Plan</Text>
              <Text style={[styles.subDesc, { color: theme.textMuted }]}>{stats.totalOrders} of 5 free orders used</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${Math.min((stats.totalOrders / 5) * 100, 100)}%` }]} />
          </View>
          <TouchableOpacity 
            style={[styles.upgradeBtn, { backgroundColor: theme.accent }]} 
            activeOpacity={0.8}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.upgradeBtnText}>Upgrade to Premium →</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.border },
              ]}
              activeOpacity={0.7}
              onPress={() => item.route ? router.push(item.route as any) : null}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={[styles.menuSubtitle, { color: theme.textMuted }]}>{item.subtitle}</Text>
              </View>
              <Text style={[styles.menuArrow, { color: theme.textMuted }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: theme.error }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutText, { color: theme.error }]}>🚪 Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.textMuted }]}>Meatzaar Vendor v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing['3xl'], marginBottom: Spacing['2xl'] },
  title: { fontSize: FontSize['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  // Vendor Card
  vendorCard: {
    marginHorizontal: Spacing['3xl'],
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  vendorAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  vendorAvatarText: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  vendorShopName: { fontSize: FontSize.xl, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  vendorOwner: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.xl },
  vendorBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
  },
  vendorBadgeText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' },
  editBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
  },
  editBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  // Subscription
  subCard: {
    marginHorizontal: Spacing['3xl'],
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing['2xl'],
  },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.xl },
  subEmoji: { fontSize: 32 },
  subTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  subDesc: { fontSize: FontSize.xs, marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: Spacing.xl, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  upgradeBtn: { paddingVertical: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center' },
  upgradeBtnText: { color: '#FFF', fontSize: FontSize.sm, fontWeight: '700' },
  // Menu
  menuCard: {
    marginHorizontal: Spacing['3xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing['3xl'],
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl },
  menuIcon: { fontSize: 22, marginRight: Spacing.xl },
  menuText: { flex: 1 },
  menuLabel: { fontSize: FontSize.md, fontWeight: '600' },
  menuSubtitle: { fontSize: FontSize.xs, marginTop: 2 },
  menuArrow: { fontSize: 24, fontWeight: '300' },
  // Logout
  logoutBtn: {
    marginHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoutText: { fontSize: FontSize.md, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: FontSize.xs, marginBottom: Spacing['4xl'] },
});

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
  { icon: '📍', label: 'Saved Addresses', subtitle: 'Manage delivery locations', route: '/edit-profile' },
  { icon: '💳', label: 'Payment Methods', subtitle: 'Cards, UPI & Wallets', route: '/payment-methods' },
  { icon: '🔔', label: 'Notifications', subtitle: 'Order updates & offers', route: '/notifications' },
  { icon: '🎁', label: 'Referral Code', subtitle: 'Invite friends, earn ₹100', route: '' },
  { icon: '📞', label: 'Help & Support', subtitle: 'FAQ, chat, call us', route: '/support' },
  { icon: '📄', label: 'Terms & Privacy', subtitle: 'Policies & legal', route: '/terms' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = React.useState({ totalOrders: 0, savedAmount: 0, rating: 0 });

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
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: `${theme.primary}15` }]}>
            {user?.avatarUrl ? (
               <Text style={styles.avatarText}>📸</Text> // In a real app, use Image component
            ) : (
               <Text style={styles.avatarText}>
                 {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
               </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.name || 'Guest User'}
            </Text>
            <Text style={[styles.userPhone, { color: theme.textSecondary }]}>
              {user?.phone || 'No phone number'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: `${theme.secondary}20` }]}>
              <Text style={[styles.roleText, { color: theme.secondary }]}>
                {user?.role || 'CUSTOMER'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.editBtn}>
            <Text style={[styles.editBtnText, { color: theme.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.statEmoji}>📦</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalOrders}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.rating || '4.8'}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Rating</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>₹{stats.savedAmount}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Saved</Text>
          </View>
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

        <Text style={[styles.version, { color: theme.textMuted }]}>Meatzaar v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['3xl'],
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing['2xl'],
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#E53935',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  userPhone: {
    fontSize: FontSize.sm,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.sm,
  },
  editBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  // Menu
  menuCard: {
    marginHorizontal: Spacing['3xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing['3xl'],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: Spacing.xl,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  // Logout
  logoutBtn: {
    marginHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    marginBottom: Spacing['4xl'],
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';

export default function VendorNotificationsScreen() {
  const theme = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    // Mock notifications for now - can be connected to backend later
    setNotifications([
      {
        id: '1',
        title: 'New Order Received',
        message: 'You have a new order from John Doe',
        time: '2 minutes ago',
        type: 'order',
        read: false
      },
      {
        id: '2',
        title: 'Order Delivered',
        message: 'Order #12345 has been marked as delivered',
        time: '1 hour ago',
        type: 'success',
        read: false
      },
      {
        id: '3',
        title: 'Payment Received',
        message: '₹499 received for subscription renewal',
        time: '1 day ago',
        type: 'payment',
        read: true
      },
      {
        id: '4',
        title: 'Inventory Alert',
        message: 'Chicken Breast is running low (5 units left)',
        time: '2 days ago',
        type: 'alert',
        read: true
      }
    ]);
    setLoading(false);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'order': return 'cart-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'payment': return 'wallet-outline';
      case 'alert': return 'warning-outline';
      default: return 'notifications-outline';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'order': return theme.primary;
      case 'success': return '#10B981';
      case 'payment': return '#F59E0B';
      case 'alert': return '#EF4444';
      default: return theme.textSecondary;
    }
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.notificationCard, { backgroundColor: item.read ? theme.cardBackground : theme.cardBackground + 'CC', borderColor: theme.cardBorder }]}
      onPress={() => !item.read && markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getColorForType(item.type) + '15' }]}>
        <Ionicons name={getIconForType(item.type)} size={24} color={getColorForType(item.type)} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
        </View>
        <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>{item.message}</Text>
        <Text style={[styles.notificationTime, { color: theme.textMuted }]}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        <TouchableOpacity onPress={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
          <Text style={[styles.markAllRead, { color: theme.primary }]}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700' },
  markAllRead: { fontSize: FontSize.sm, fontWeight: '600' },
  list: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.md },
  notificationCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: { fontSize: FontSize.md, fontWeight: '600' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: { fontSize: FontSize.sm, marginBottom: 4 },
  notificationTime: { fontSize: FontSize.xs },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: FontSize.md },
});

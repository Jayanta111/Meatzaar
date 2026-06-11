import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Vibration,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import api from '@/lib/api';
import { initSocket } from '@/lib/socket';
import { Ionicons } from '@expo/vector-icons';

export default function VendorDashboard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Pulse animation for the status indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline]);

  const fetchPendingOrders = async () => {
    try {
      const response = await api.get('/orders/vendor/pending');
      // Handle paginated response structure: { data: [...], pagination: {...} }
      const ordersArray = response.data?.data || response.data || [];
      setOrders(ordersArray);
    } catch (error) {
      console.error('Failed to fetch pending orders', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/payments/subscription');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPendingOrders();
      fetchSubscription();
    }, [])
  );

  useEffect(() => {
    const socket = initSocket();
    
    socket.on('new_order', (newOrder) => {
      if (isOnline) {
        Vibration.vibrate([100, 200, 100, 200]); // Pulse vibrate
        setOrders(prev => [newOrder, ...prev]);
      }
    });

    socket.on('order_accepted_global', ({ orderId }) => {
      // Remove order from radar if another vendor accepted it
      setOrders(prev => prev.filter(o => o.id !== orderId));
    });

    return () => {
      socket.off('new_order');
      socket.off('order_accepted_global');
    };
  }, [isOnline]);

  const acceptOrder = async (orderId: string) => {
    // Check subscription and order limit for FREE plan
    const planType = subscription?.planType || 'FREE';
    const ordersAccepted = subscription?.ordersAccepted || 0;
    const FREE_ORDER_LIMIT = 5;

    if (planType === 'FREE' && ordersAccepted >= FREE_ORDER_LIMIT) {
      Alert.alert(
        '⚠️ Order Limit Reached',
        `You've reached your monthly limit of ${FREE_ORDER_LIMIT} orders on the FREE plan.\n\nUpgrade to Premium to accept unlimited orders.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade Now',
            onPress: () => router.push('/subscription')
          }
        ]
      );
      return;
    }

    try {
      await api.post(`/orders/${orderId}/accept`);
      
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setAcceptedOrders((prev) => [{...order, status: 'ACCEPTED'}, ...prev]);
        Vibration.vibrate(100);
        Alert.alert('✅ Order Accepted', `Order #${orderId.split('-')[0]} is now assigned to you.`);
        
        // Refresh subscription to update order count
        fetchSubscription();
      }
    } catch (error: any) {
      Alert.alert('Action Failed', error.response?.data?.error || 'Could not accept order.');
      // Remove it if it was already accepted
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      
      setAcceptedOrders((prev) => prev.map((o) => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      Vibration.vibrate(100);
      
      if (newStatus === 'DELIVERED') {
        Alert.alert('🎉 Order Delivered!', `Order #${orderId.split('-')[0]} has been successfully delivered.`);
      }
    } catch (error: any) {
      Alert.alert('Action Failed', error.response?.data?.error || 'Could not update order status.');
    }
  };

  const rejectOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingOrders();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <View>
            <Text style={[styles.shopName, { color: theme.text }]}>
              {user?.shopName || 'Your Shop'} <Ionicons name="storefront-outline" size={20} color={theme.text} />
            </Text>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Vendor Dashboard
            </Text>
          </View>

          {/* Online Toggle */}
          <TouchableOpacity
            style={[
              styles.statusToggle,
              { backgroundColor: isOnline ? `${theme.secondary}20` : `${theme.error}20` },
            ]}
            onPress={() => setIsOnline(!isOnline)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? theme.secondary : theme.error },
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? theme.secondary : theme.error },
              ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}30` }]}>
            <Ionicons name="document-text-outline" size={24} color={theme.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.statValue, { color: theme.primary }]}>{orders.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: `${theme.secondary}12`, borderColor: `${theme.secondary}30` }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={theme.secondary} style={{ marginBottom: 4 }} />
            <Text style={[styles.statValue, { color: theme.secondary }]}>{acceptedOrders.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Accepted</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: `${theme.accent}12`, borderColor: `${theme.accent}30` }]}>
            <Ionicons name="cash-outline" size={24} color={theme.accent} style={{ marginBottom: 4 }} />
            <Text style={[styles.statValue, { color: theme.accent }]}>₹{acceptedOrders.reduce((s, o) => s + o.totalAmount, 0)}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Today</Text>
          </View>
        </View>

        {/* Incoming Orders */}
        {orders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                <Ionicons name="notifications-outline" size={20} /> Incoming Orders
              </Text>
              <View style={[styles.liveBadge, { backgroundColor: theme.error }]}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {orders.map((order) => (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.primary,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={[styles.orderId, { color: theme.text }]}>#{order.id.split('-')[0]}</Text>
                    <Text style={[styles.orderTime, { color: theme.textMuted }]}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={[styles.paymentBadge, {
                    backgroundColor: order.paymentMethod === 'CASH' ? `${theme.secondary}20` : `${theme.info}20`,
                  }]}>
                    <Text style={{ color: order.paymentMethod === 'CASH' ? theme.secondary : theme.info, fontSize: FontSize.xs, fontWeight: '700' }}>
                      {order.paymentMethod === 'CASH' ? '💵 COD' : '💳 Paid'}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="person-outline" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.orderCustomer, { color: theme.textSecondary, marginBottom: 0 }]}>
                      {order.customer?.name || 'Customer'} {order.customer?.phone ? `• ${order.customer.phone}` : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.orderCustomer, { color: theme.textSecondary, marginBottom: 0, flex: 1 }]} numberOfLines={2}>
                      {order.deliveryAddress || 'Address not provided'}
                    </Text>
                  </View>
                </View>
                <View style={{ marginBottom: Spacing.sm }}>
                  {order.items?.map((i: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Ionicons name="ellipse" size={4} color={theme.textMuted} style={{ marginRight: 6 }} />
                      <Text style={[styles.orderItems, { color: theme.text, marginBottom: 0 }]}>
                        {i.product?.name} x{i.quantity}
                      </Text>
                    </View>
                  ))}
                  {!order.items && <Text style={[styles.orderItems, { color: theme.text }]}>Items pending</Text>}
                </View>
                <Text style={[styles.orderTotal, { color: theme.primary }]}>
                  ₹{order.totalAmount}
                </Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { borderColor: theme.error }]}
                    onPress={() => rejectOrder(order.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.rejectText, { color: theme.error }]}>✕ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: theme.secondary }]}
                    onPress={() => acceptOrder(order.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.acceptText}>✓ Accept Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* No orders state */}
        {orders.length === 0 && isOnline && (
          <View style={styles.emptyState}>
            <Ionicons name="radio-outline" size={64} color={theme.textMuted} style={{ marginBottom: Spacing.xl }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Waiting for orders...</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              New orders will appear here in real-time
            </Text>
          </View>
        )}

        {!isOnline && (
          <View style={styles.emptyState}>
            <Ionicons name="moon-outline" size={64} color={theme.textMuted} style={{ marginBottom: Spacing.xl }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>You're Offline</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Toggle online to start receiving orders
            </Text>
          </View>
        )}

        {/* Accepted Orders */}
        {acceptedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>✅ Active Orders</Text>
            {acceptedOrders.map((order) => {
              const statusConfig: Record<string, { label: string; color: any; nextStatus: string | null }> = {
                ACCEPTED: { label: 'Preparing', color: theme.accent, nextStatus: 'PREPARING' },
                PREPARING: { label: 'Preparing', color: theme.accent, nextStatus: 'OUT_FOR_DELIVERY' },
                OUT_FOR_DELIVERY: { label: 'On the Way', color: theme.info, nextStatus: 'DELIVERED' },
                DELIVERED: { label: 'Delivered', color: theme.secondary, nextStatus: null },
              };
              const config = statusConfig[order.status as string] || statusConfig.ACCEPTED;

              return (
                <View
                  key={order.id}
                  style={[styles.activeCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                >
                  <View style={styles.activeHeader}>
                    <Text style={[styles.orderId, { color: theme.text }]}>#{order.id.split('-')[0]}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${config.color}20` }]}>
                      <Text style={{ color: config.color, fontSize: FontSize.xs, fontWeight: '700' }}>{config.label}</Text>
                    </View>
                  </View>
                  
                  <View style={{ marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="person-outline" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.orderCustomer, { color: theme.textSecondary, marginBottom: 0 }]}>
                          {order.customer?.name || 'Customer'} {order.customer?.phone ? `• ${order.customer.phone}` : ''}
                        </Text>
                      </View>
                      {order.customer?.phone && (
                        <TouchableOpacity 
                          style={{ backgroundColor: `${theme.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => Linking.openURL(`tel:${order.customer.phone}`)}
                        >
                          <Ionicons name="call" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                          <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '800' }}>CALL</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.orderCustomer, { color: theme.textSecondary, marginBottom: 0, flex: 1 }]} numberOfLines={2}>
                        {order.deliveryAddress || 'Address not provided'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: Spacing.sm }}>
                    {order.items?.map((i: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Ionicons name="ellipse" size={4} color={theme.textMuted} style={{ marginRight: 6 }} />
                        <Text style={[styles.orderItems, { color: theme.textSecondary, marginBottom: 0 }]}>
                          {i.product?.name} x{i.quantity}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.orderTotal, { color: theme.secondary }]}>₹{order.totalAmount}</Text>
                  
                  {config.nextStatus && (
                    <TouchableOpacity
                      style={[styles.updateBtn, { backgroundColor: config.color }]}
                      onPress={() => config.nextStatus && updateOrderStatus(order.id, config.nextStatus)}
                    >
                      <Text style={styles.updateBtnText}>
                        {config.nextStatus === 'PREPARING' ? 'Start Preparing' : 
                         config.nextStatus === 'OUT_FOR_DELIVERY' ? 'Mark Out for Delivery' :
                         'Mark Delivered'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['2xl'],
  },
  shopName: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.lg,
    marginBottom: Spacing['3xl'],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statEmoji: { fontSize: 20, marginBottom: Spacing.sm },
  statValue: { fontSize: FontSize.lg, fontWeight: '800' },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  // Sections
  section: {
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  liveBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Order Card
  orderCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  orderId: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  orderTime: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  paymentBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  orderCustomer: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  orderItems: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  orderTotal: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  rejectText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  acceptText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  // Active
  activeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  updateBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing['3xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
  },
});

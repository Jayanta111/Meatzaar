import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import api from '@/lib/api';
import { initSocket } from '@/lib/socket';
import { Ionicons } from '@expo/vector-icons';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; progress: number }> = {
  PENDING: { label: 'Pending', color: '#F59E0B', icon: 'time-outline', progress: 10 },
  ACCEPTED: { label: 'Accepted', color: '#3B82F6', icon: 'checkmark-circle-outline', progress: 25 },
  PREPARING: { label: 'Preparing', color: '#8B5CF6', icon: 'restaurant-outline', progress: 50 },
  OUT_FOR_DELIVERY: { label: 'On the Way', color: '#F97316', icon: 'bicycle-outline', progress: 75 },
  DELIVERED: { label: 'Delivered', color: '#10B981', icon: 'checkmark-done-outline', progress: 100 },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline', progress: 0 },
};

export default function OrdersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/customer');
      // Handle paginated response structure: { data: [...], pagination: {...} }
      const ordersArray = response.data?.data || response.data || [];
      setOrders(ordersArray);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  useEffect(() => {
    const socket = initSocket();
    
    // Attach listeners for all active orders
    const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
    
    activeOrders.forEach(order => {
      socket.on(`order_status_${order.id}`, (data) => {
        setOrders(prev => prev.map(o => 
          o.id === order.id ? { ...o, status: data.status, vendorId: data.vendorId || o.vendorId } : o
        ));
      });
    });

    return () => {
      activeOrders.forEach(order => {
        socket.off(`order_status_${order.id}`);
      });
    };
  }, [orders]);

  const submitReview = async () => {
    if (!selectedOrder) return;
    try {
      setSubmittingReview(true);
      await api.post('/reviews', {
        vendorId: selectedOrder.vendorId,
        rating,
        comment: reviewComment
      });
      Alert.alert('Success', 'Thank you for your feedback!');
      setReviewModalVisible(false);
      setReviewComment('');
      setRating(5);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <Text style={[styles.title, { color: theme.text }]}>My Orders</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Track your deliveries
          </Text>
        </View>

        {/* Active Orders */}
        {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active</Text>
            {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              return (
                <View
                  key={order.id}
                  style={[styles.orderCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                >
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderId, { color: theme.text }]}>#{order.id.split('-')[0]}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${config.color}20` }]}>
                      <Ionicons name={config.icon} size={14} color={config.color} />
                      <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
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
                    {!order.items && <Text style={[styles.orderItems, { color: theme.textSecondary }]}>Processing...</Text>}
                  </View>
                  {order.vendor && (
                    <Text style={[styles.orderVendor, { color: theme.textMuted }]}>Assigned to: {order.vendor.shopName}</Text>
                  )}

                  <View style={[styles.orderFooter, { borderTopColor: theme.border }]}>
                    <Text style={[styles.orderDate, { color: theme.textMuted }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                    <Text style={[styles.orderTotal, { color: theme.primary }]}>₹{order.totalAmount}</Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: config.color,
                          width: order.status === 'PREPARING' ? '50%' : order.status === 'OUT_FOR_DELIVERY' ? '75%' : order.status === 'ACCEPTED' ? '30%' : '10%',
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Past Orders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Past Orders</Text>
          {orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED').map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.CANCELLED;
            return (
              <View
                key={order.id}
                style={[styles.orderCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, opacity: 0.8 }]}
              >
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderId, { color: theme.text }]}>#{order.id.split('-')[0]}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${config.color}20` }]}>
                    <Ionicons name={config.icon} size={14} color={config.color} />
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
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
                    {!order.items && <Text style={[styles.orderItems, { color: theme.textSecondary }]}>Processing...</Text>}
                  </View>
                  
                  {order.vendor && (
                    <Text style={[styles.orderVendor, { color: theme.textMuted }]}>
                      Fulfilled by: {order.vendor.shopName} ({order.vendor.name})
                    </Text>
                  )}

                <View style={[styles.orderFooter, { borderTopColor: theme.border }]}>
                  <Text style={[styles.orderDate, { color: theme.textMuted }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                  <Text style={[styles.orderTotal, { color: theme.text }]}>₹{order.totalAmount}</Text>
                </View>
                
                {order.status === 'DELIVERED' && order.vendorId && (
                  <TouchableOpacity
                    style={[styles.rateBtn, { borderColor: theme.primary }]}
                    onPress={() => {
                      setSelectedOrder(order);
                      setReviewModalVisible(true);
                    }}
                  >
                    <Ionicons name="star-outline" size={16} color={theme.primary} />
                    <Text style={[styles.rateBtnText, { color: theme.primary }]}>Rate Vendor</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Rate {selectedOrder?.vendor?.shopName || 'Vendor'}</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={32} 
                    color="#F59E0B" 
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.reviewInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              placeholder="Leave a comment (optional)..."
              placeholderTextColor={theme.textMuted}
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.backgroundElement }]} 
                onPress={() => setReviewModalVisible(false)}
                disabled={submittingReview}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.primary }]} 
                onPress={submitReview}
                disabled={submittingReview}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {submittingReview ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.xl,
  },
  orderCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  orderId: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  orderItems: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  orderVendor: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.lg,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
  },
  orderDate: {
    fontSize: FontSize.xs,
  },
  orderTotal: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  successText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  rateBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing['3xl'],
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});

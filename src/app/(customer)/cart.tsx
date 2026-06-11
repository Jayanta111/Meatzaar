import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useCartStore } from '@/store/cart-store';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import api from '@/lib/api';
import RazorpayCheckout from 'react-native-razorpay';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    deliveryAddress,
    setDeliveryAddress,
  } = useCartStore();

  const subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const DELIVERY_FEE = items.length > 0 ? 30 : 0;
  const grandTotal = subTotal + DELIVERY_FEE;

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Cart Empty', 'Add some items first!');
      return;
    }

    if (!deliveryAddress?.trim()) {
      Alert.alert('Address Required', 'Please provide a delivery address.');
      return;
    }

    try {
      setLoading(true);

      const orderItems = items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.price,
        subtotal: i.price * i.quantity
      }));

      // If Razorpay, generate order ID first
      let razorpayOrderId = null;
      if (paymentMethod === 'RAZORPAY') {
        const rzpResponse = await api.post('/payments/create-order', { amount: grandTotal });
        razorpayOrderId = rzpResponse.data.id;
      }

      // Create Order in DB
      const orderResponse = await api.post('/orders', {
        totalAmount: grandTotal,
        deliveryFee: DELIVERY_FEE,
        paymentMethod,
        deliveryAddress: deliveryAddress || '123 Main St, Default Address',
        items: orderItems
      });

      if (paymentMethod === 'RAZORPAY' && razorpayOrderId) {
        // Trigger Razorpay Native SDK
        try {
          const options = {
            description: 'Meat Delivery Order',
            image: 'https://i.imgur.com/3g7nmJC.png',
            currency: 'INR',
            key: 'rzp_test_SsvthQ70FMfSHV', // Public Test Key
            amount: grandTotal * 100,
            name: 'Meat Delivery App',
            order_id: razorpayOrderId,
            theme: { color: theme.primary }
          };
          
          const data = await RazorpayCheckout.open(options);
          
          // Verify on backend
          await api.post('/payments/verify', {
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature
          });

        } catch (error: any) {
          console.log(error);
          if (error.code === 'E_UNHANDLED' || error.message?.includes('null')) {
            Alert.alert('Development Mode', 'Razorpay native SDK requires a custom dev build (npx expo run:android). Payment simulated as successful for testing.');
          } else {
            Alert.alert('Payment Failed', error.description || 'Transaction cancelled.');
            return; // Stop if user cancelled
          }
        }
      }

      Alert.alert(
        'Order Placed! 🎉',
        `Your order of ₹${grandTotal} has been placed successfully!`,
        [{ 
          text: 'OK', 
          onPress: () => {
            clearCart();
            router.push('/(customer)/orders');
          }
        }]
      );

    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to place order. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const [locationLoading, setLocationLoading] = React.useState(false);

  const fetchCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const addressStr = [place.name, place.street, place.city, place.region, place.postalCode]
          .filter(Boolean)
          .join(', ');
        setDeliveryAddress(addressStr);
      } else {
        setDeliveryAddress(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch location.');
    } finally {
      setLocationLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <Ionicons name="cart-outline" size={64} color={theme.textMuted} style={{ marginBottom: Spacing['2xl'] }} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Add some delicious items from the menu!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <Text style={[styles.title, { color: theme.text }]}>Your Cart</Text>
          <TouchableOpacity onPress={clearCart}>
            <Text style={[styles.clearBtn, { color: theme.error }]}>Clear All</Text>
          </TouchableOpacity>
        </View>

          {/* Cart Items */}
        {items.map((item) => (
          <View
            key={item.productId}
            style={[styles.cartItem, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          >
            <View style={[styles.itemImageBox, { backgroundColor: `${theme.primary}10` }]}>
              <Ionicons name="restaurant-outline" size={28} color={theme.primary} />
            </View>

            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.itemVendor, { color: theme.textMuted }]}>
                {item.vendorName || 'Local Vendor'}
              </Text>
              <Text style={[styles.itemPrice, { color: theme.primary }]}>
                ₹{item.price} / {item.unit}
              </Text>
            </View>

            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              >
                <Text style={[styles.qtyBtnText, { color: theme.text }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: theme.primary }]}
                onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              >
                <Text style={[styles.qtyBtnText, { color: '#FFF' }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Address</Text>
          <View style={[styles.addressContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <TextInput
              style={[styles.addressInput, { color: theme.text }]}
              placeholder="Enter complete delivery address..."
              placeholderTextColor={theme.textMuted}
              multiline
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
            />
            <TouchableOpacity 
              style={[styles.locationBtn, { backgroundColor: `${theme.primary}15` }]}
              onPress={fetchCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="location" size={18} color={theme.primary} />
                  <Text style={[styles.locationBtnText, { color: theme.primary }]}>Use Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === 'CASH' ? `${theme.secondary}15` : theme.backgroundElement,
                  borderColor: paymentMethod === 'CASH' ? theme.secondary : theme.border,
                },
              ]}
              onPress={() => setPaymentMethod('CASH')}
            >
              <Ionicons name="cash-outline" size={24} color={paymentMethod === 'CASH' ? theme.secondary : theme.text} />
              <Text style={[styles.paymentLabel, { color: paymentMethod === 'CASH' ? theme.secondary : theme.text }]}>
                Cash on Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === 'RAZORPAY' ? `${theme.info}15` : theme.backgroundElement,
                  borderColor: paymentMethod === 'RAZORPAY' ? theme.info : theme.border,
                },
              ]}
              onPress={() => setPaymentMethod('RAZORPAY')}
            >
              <Ionicons name="card-outline" size={24} color={paymentMethod === 'RAZORPAY' ? theme.info : theme.text} />
              <Text style={[styles.paymentLabel, { color: paymentMethod === 'RAZORPAY' ? theme.info : theme.text }]}>
                Pay Online
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: Spacing.xl }]}>
            Order Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>₹{subTotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>₹{DELIVERY_FEE}</Text>
          </View>
          <View style={[styles.totalDivider, { borderTopColor: theme.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout CTA */}
      <View style={[styles.checkoutBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.lg }]}>
        <View>
          <Text style={[styles.checkoutLabel, { color: theme.textMuted }]}>Total</Text>
          <Text style={[styles.checkoutTotal, { color: theme.text }]}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: theme.primary }]}
          onPress={handleCheckout}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutBtnText}>Place Order →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  clearBtn: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Cart Item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['3xl'],
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  itemImageBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  itemEmoji: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  itemVendor: {
    fontSize: FontSize.xs,
    marginVertical: 2,
  },
  itemPrice: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  qtyText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  // Payment
  section: {
    paddingHorizontal: Spacing['3xl'],
    marginTop: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.lg,
  },
  // Address
  addressContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  addressInput: {
    minHeight: 80,
    padding: Spacing.xl,
    fontSize: FontSize.md,
    textAlignVertical: 'top',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.sm,
  },
  locationBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  paymentEmoji: {
    fontSize: 22,
  },
  paymentLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Summary
  summaryCard: {
    marginHorizontal: Spacing['3xl'],
    marginTop: Spacing['3xl'],
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    fontSize: FontSize.md,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  totalDivider: {
    borderTopWidth: 1,
    marginVertical: Spacing.lg,
  },
  totalLabel: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  // Checkout Bar
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing.xl,
    borderTopWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  checkoutLabel: {
    fontSize: FontSize.xs,
    marginBottom: 2,
  },
  checkoutTotal: {
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  checkoutBtn: {
    paddingHorizontal: Spacing['4xl'],
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});

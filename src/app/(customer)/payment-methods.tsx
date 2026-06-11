import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function PaymentMethodsScreen() {
  const theme = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMethod, setNewMethod] = useState({ type: 'UPI', upiId: '', cardNumber: '', expiry: '', cvv: '' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentMethods();
    }
  }, [isAuthenticated]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/methods');
      setPaymentMethods(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch payment methods', err);
      if (err.response?.status !== 401) {
        Alert.alert('Error', 'Failed to fetch payment methods');
      }
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    if (newMethod.type === 'UPI' && !newMethod.upiId) {
      Alert.alert('Error', 'Please enter UPI ID');
      return;
    }
    if (newMethod.type === 'CARD' && (!newMethod.cardNumber || !newMethod.expiry || !newMethod.cvv)) {
      Alert.alert('Error', 'Please fill all card details');
      return;
    }

    try {
      const details = newMethod.type === 'UPI' 
        ? { upiId: newMethod.upiId, isDefault: paymentMethods.length === 0 }
        : { cardNumber: newMethod.cardNumber, expiry: newMethod.expiry, cvv: newMethod.cvv, isDefault: paymentMethods.length === 0 };

      await api.post('/payments/methods', {
        type: newMethod.type,
        provider: 'razorpay',
        details
      });

      setNewMethod({ type: 'UPI', upiId: '', cardNumber: '', expiry: '', cvv: '' });
      setShowAddModal(false);
      fetchPaymentMethods();
      Alert.alert('Success', 'Payment method added successfully');
    } catch (err: any) {
      console.error('Failed to add payment method', err);
      Alert.alert('Error', 'Failed to add payment method');
    }
  };

  const deletePaymentMethod = async (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/payments/methods/${id}`);
              fetchPaymentMethods();
              Alert.alert('Success', 'Payment method deleted');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete payment method');
            }
          }
        }
      ]
    );
  };

  const setDefaultPaymentMethod = async (id: string) => {
    try {
      await api.patch(`/payments/methods/${id}/default`);
      fetchPaymentMethods();
      Alert.alert('Success', 'Default payment method updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to set default payment method');
    }
  };

  const renderPaymentMethod = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.type === 'UPI' ? '#6739B7' + '20' : '#2563EB' + '20' }]}>
          <Ionicons name={item.type === 'UPI' ? 'logo-google' as const : 'card' as const} size={24} color={item.type === 'UPI' ? '#6739B7' : '#2563EB'} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardType, { color: theme.text }]}>{item.type}</Text>
          <Text style={[styles.cardDetails, { color: theme.textSecondary }]}>
            {item.type === 'UPI' ? item.details.upiId : `**** **** **** ${item.details.cardNumber.slice(-4)}`}
          </Text>
        </View>
        {item.isDefault && (
          <View style={[styles.defaultBadge, { backgroundColor: theme.secondary + '20' }]}>
            <Text style={[styles.defaultText, { color: theme.secondary }]}>Default</Text>
          </View>
        )}
      </View>
      <View style={styles.cardActions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primary + '15' }]}
            onPress={() => setDefaultPaymentMethod(item.id)}
          >
            <Text style={[styles.actionText, { color: theme.primary }]}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#EF444415' }]}
          onPress={() => deletePaymentMethod(item.id)}
        >
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Payment Methods' }} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Payment Methods</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : paymentMethods.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No payment methods yet</Text>
        </View>
      ) : (
        <FlatList
          data={paymentMethods}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentMethod}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={showAddModal} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Payment Method</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeOption, { backgroundColor: newMethod.type === 'UPI' ? theme.primary + '20' : theme.cardBackground, borderColor: newMethod.type === 'UPI' ? theme.primary : theme.border }]}
                onPress={() => setNewMethod({ ...newMethod, type: 'UPI' })}
              >
                <Ionicons name="logo-google" size={28} color={newMethod.type === 'UPI' ? '#6739B7' : theme.textSecondary} />
                <Text style={[styles.typeText, { color: newMethod.type === 'UPI' ? theme.primary : theme.text }]}>UPI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, { backgroundColor: newMethod.type === 'CARD' ? theme.primary + '20' : theme.cardBackground, borderColor: newMethod.type === 'CARD' ? theme.primary : theme.border }]}
                onPress={() => setNewMethod({ ...newMethod, type: 'CARD' })}
              >
                <Ionicons name="card" size={28} color={newMethod.type === 'CARD' ? '#2563EB' : theme.textSecondary} />
                <Text style={[styles.typeText, { color: newMethod.type === 'CARD' ? theme.primary : theme.text }]}>Card</Text>
              </TouchableOpacity>
            </View>

            {newMethod.type === 'UPI' ? (
              <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>UPI ID</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="yourname@upi"
                  placeholderTextColor={theme.textMuted}
                  value={newMethod.upiId}
                  onChangeText={(text) => setNewMethod({ ...newMethod, upiId: text })}
                />
              </View>
            ) : (
              <>
                <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Card Number</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={theme.textMuted}
                    value={newMethod.cardNumber}
                    onChangeText={(text) => setNewMethod({ ...newMethod, cardNumber: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfInput, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Expiry</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="MM/YY"
                      placeholderTextColor={theme.textMuted}
                      value={newMethod.expiry}
                      onChangeText={(text) => setNewMethod({ ...newMethod, expiry: text })}
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.halfInput, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>CVV</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="123"
                      placeholderTextColor={theme.textMuted}
                      value={newMethod.cvv}
                      onChangeText={(text) => setNewMethod({ ...newMethod, cvv: text })}
                      keyboardType="numeric"
                      secureTextEntry
                    />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={addPaymentMethod}
            >
              <Text style={styles.submitBtnText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: FontSize.sm },
  list: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.md },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardType: { fontSize: FontSize.md, fontWeight: '600' },
  cardDetails: { fontSize: FontSize.sm, marginTop: 2 },
  defaultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultText: { fontSize: FontSize.xs, fontWeight: '600' },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: { fontSize: FontSize.sm, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: FontSize.md },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  modalContent: { padding: Spacing.xl, gap: Spacing.lg },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeOption: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeText: { fontSize: FontSize.sm, fontWeight: '600' },
  inputContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  inputLabel: { fontSize: FontSize.xs, fontWeight: '600' },
  input: { fontSize: FontSize.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  halfInput: { flex: 1 },
  submitBtn: {
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
});

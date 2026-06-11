import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Linking } from 'react-native';

export default function SubscriptionScreen() {
  const theme = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [isAuthenticated]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/subscription');
      setSubscription(response.data);
    } catch (err: any) {
      console.error('Failed to fetch subscription', err);
      if (err.response?.status !== 401) {
        Alert.alert('Error', 'Failed to fetch subscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPlan = async (planType: string) => {
    try {
      setProcessing(true);
      const response = await api.post('/payments/subscription', { planType });
      
      if (response.data.short_url) {
        // Open Razorpay checkout
        await Linking.openURL(response.data.short_url);
      } else if (response.data.message) {
        // Razorpay not configured, subscription created without payment
        Alert.alert('Success', response.data.message);
        await fetchSubscription();
      }
    } catch (err: any) {
      console.error('Failed to create subscription', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to create subscription');
    } finally {
      setProcessing(false);
    }
  };

  const cancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await api.delete('/payments/subscription');
              await fetchSubscription();
              Alert.alert('Success', 'Subscription cancelled successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel subscription');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const PLAN_FEATURES = {
    FREE: [
      '14 days free trial',
      'Basic inventory management',
      'Standard customer support',
      'Manual order processing'
    ],
    PREMIUM: [
      'Unlimited orders per month',
      'Advanced inventory analytics',
      'Priority customer support',
      'Auto-order processing',
      'Promotional tools',
      'Vendor dashboard insights'
    ]
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Subscription' }} />
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      </View>
    );
  }

  const currentPlan = subscription?.planType || 'FREE';
  const isPremium = currentPlan === 'PREMIUM';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Subscription' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Choose Your Plan</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Upgrade to unlock premium features
          </Text>
        </View>

        {/* Current Plan Badge */}
        <View style={[styles.currentPlanBadge, { backgroundColor: isPremium ? '#10B98120' : '#6B728020' }]}>
          <Ionicons name={isPremium ? 'diamond' : 'person'} size={20} color={isPremium ? '#10B981' : '#6B7280'} />
          <Text style={[styles.currentPlanText, { color: isPremium ? '#10B981' : '#6B7280' }]}>
            Current Plan: {currentPlan}
          </Text>
        </View>

        {/* Free Plan */}
        <View style={[styles.planCard, { backgroundColor: theme.cardBackground, borderColor: currentPlan === 'FREE' ? theme.primary : theme.cardBorder }]}>
          <View style={styles.planHeader}>
            <View style={[styles.planIcon, { backgroundColor: '#6B728020' }]}>
              <Ionicons name="person" size={32} color="#6B7280" />
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planName, { color: theme.text }]}>Free</Text>
              <Text style={[styles.planPrice, { color: theme.textSecondary }]}>₹0/month</Text>
            </View>
            {currentPlan === 'FREE' && (
              <View style={[styles.activeBadge, { backgroundColor: theme.secondary + '20' }]}>
                <Text style={[styles.activeText, { color: theme.secondary }]}>Active</Text>
              </View>
            )}
          </View>

          <View style={styles.features}>
            {PLAN_FEATURES.FREE.map((feature, index) => (
              <View key={index} style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {currentPlan !== 'FREE' && (
            <TouchableOpacity
              style={[styles.downgradeBtn, { backgroundColor: '#EF444415' }]}
              onPress={cancelSubscription}
              disabled={processing}
            >
              <Text style={[styles.downgradeBtnText, { color: '#EF4444' }]}>
                {processing ? 'Processing...' : 'Downgrade to Free'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Premium Plan */}
        <View style={[styles.planCard, { backgroundColor: theme.cardBackground, borderColor: currentPlan === 'PREMIUM' ? theme.primary : theme.cardBorder }]}>
          <View style={styles.planHeader}>
            <View style={[styles.planIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="diamond" size={32} color="#10B981" />
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planName, { color: theme.text }]}>Premium</Text>
              <Text style={[styles.planPrice, { color: theme.textSecondary }]}>₹499/month</Text>
            </View>
            {currentPlan === 'PREMIUM' && (
              <View style={[styles.activeBadge, { backgroundColor: theme.secondary + '20' }]}>
                <Text style={[styles.activeText, { color: theme.secondary }]}>Active</Text>
              </View>
            )}
          </View>

          <View style={styles.features}>
            {PLAN_FEATURES.PREMIUM.map((feature, index) => (
              <View key={index} style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {currentPlan !== 'PREMIUM' ? (
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}
              onPress={() => subscribeToPlan('PREMIUM')}
              disabled={processing}
            >
              <Text style={styles.upgradeBtnText}>
                {processing ? 'Processing...' : 'Upgrade to Premium'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: '#EF444415' }]}
              onPress={cancelSubscription}
              disabled={processing}
            >
              <Text style={[styles.cancelBtnText, { color: '#EF4444' }]}>
                {processing ? 'Processing...' : 'Cancel Subscription'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Subscription Info */}
        {subscription?.validUntil && (
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Your subscription renews automatically on {new Date(subscription.validUntil).toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: '800' },
  subtitle: { fontSize: FontSize.md, marginTop: 4 },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  currentPlanText: { fontSize: FontSize.sm, fontWeight: '600' },
  planCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  planInfo: { flex: 1 },
  planName: { fontSize: FontSize.xl, fontWeight: '700' },
  planPrice: { fontSize: FontSize.md, marginTop: 2 },
  activeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeText: { fontSize: FontSize.xs, fontWeight: '600' },
  features: { gap: Spacing.md, marginBottom: Spacing.xl },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: { fontSize: FontSize.sm, flex: 1 },
  upgradeBtn: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  upgradeBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
  downgradeBtn: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  downgradeBtnText: { fontSize: FontSize.md, fontWeight: '600' },
  cancelBtn: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: FontSize.md, fontWeight: '600' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoText: { fontSize: FontSize.sm, flex: 1 },
});

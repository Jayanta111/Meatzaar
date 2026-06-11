import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import api from '@/lib/api';

export default function EarningsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchEarnings = async () => {
        try {
          const response = await api.get('/orders/vendor/earnings');
          const data = response.data;
          setWeeklyData(data.weeklyData || []);
          setRecentTransactions(data.recentTransactions || []);
        } catch (error) {
          console.error('Failed to fetch earnings', error);
        } finally {
          setLoading(false);
        }
      };

      fetchEarnings();
    }, [])
  );

  const maxEarnings = weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.earnings)) || 1 : 1;
  const totalWeekly = weeklyData.reduce((s, d) => s + d.earnings, 0);
  const totalOrders = weeklyData.reduce((s, d) => s + d.orders, 0);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <Text style={[styles.title, { color: theme.text }]}>Earnings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>This week's overview</Text>
        </View>

        {/* Big Earnings Card */}
        <View style={[styles.earningsCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.earningsLabel}>Total Earnings (7 Days)</Text>
          <Text style={styles.earningsAmount}>₹{totalWeekly.toLocaleString()}</Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>{totalOrders}</Text>
              <Text style={styles.earningsStatLabel}>Orders</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>₹{totalOrders > 0 ? Math.round(totalWeekly / totalOrders) : 0}</Text>
              <Text style={styles.earningsStatLabel}>Avg/Order</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>FREE</Text>
              <Text style={styles.earningsStatLabel}>Plan</Text>
            </View>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Daily Breakdown</Text>
          <View style={[styles.chartCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.chart}>
              {weeklyData.map((data, index) => {
                const barHeight = maxEarnings > 0 ? (data.earnings / maxEarnings) * 120 : 0;
                const isToday = index === weeklyData.length - 1; // Last element is today
                return (
                  <View key={data.day} style={styles.barColumn}>
                    <Text style={[styles.barValue, { color: theme.textMuted }]}>
                      ₹{(data.earnings / 1000).toFixed(1)}k
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isToday ? theme.primary : `${theme.primary}40`,
                          borderRadius: 6,
                        },
                      ]}
                    />
                    <Text style={[styles.barLabel, { color: isToday ? theme.primary : theme.textMuted }]}>
                      {data.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💳 Recent Transactions</Text>
          {recentTransactions.map((txn) => (
            <View
              key={txn.id}
              style={[styles.txnCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.txnIcon, { backgroundColor: txn.method === 'CASH' ? `${theme.secondary}15` : `${theme.info}15` }]}>
                <Text style={{ fontSize: 20 }}>{txn.method === 'CASH' ? '💵' : '💳'}</Text>
              </View>
              <View style={styles.txnInfo}>
                <Text style={[styles.txnOrderId, { color: theme.text }]}>{txn.orderId}</Text>
                <Text style={[styles.txnTime, { color: theme.textMuted }]}>{txn.time}</Text>
              </View>
              <Text style={[styles.txnAmount, { color: theme.secondary }]}>+₹{txn.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['2xl'],
  },
  title: { fontSize: FontSize['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.sm, marginTop: 2 },
  // Earnings Card
  earningsCard: {
    marginHorizontal: Spacing['3xl'],
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing['3xl'],
  },
  earningsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginBottom: Spacing.sm },
  earningsAmount: { color: '#FFF', fontSize: FontSize['5xl'], fontWeight: '800', letterSpacing: -1, marginBottom: Spacing['2xl'] },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  earningsStat: { alignItems: 'center' },
  earningsStatValue: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '800' },
  earningsStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, marginTop: 2 },
  earningsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', height: 30 },
  // Sections
  section: { paddingHorizontal: Spacing['3xl'], marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', marginBottom: Spacing.xl },
  // Chart
  chartCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing['2xl'] },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barColumn: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  barValue: { fontSize: 9, marginBottom: 4, fontWeight: '600' },
  bar: { width: 28, minHeight: 8 },
  barLabel: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 6 },
  // Transactions
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  txnIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.xl },
  txnInfo: { flex: 1 },
  txnOrderId: { fontSize: FontSize.md, fontWeight: '700' },
  txnTime: { fontSize: FontSize.xs, marginTop: 2 },
  txnAmount: { fontSize: FontSize.lg, fontWeight: '800' },
});

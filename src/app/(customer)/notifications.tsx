import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, Spacing } from '@/constants/theme';

export default function NotificationsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.textSecondary }]}>You have no new notifications.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  text: { fontSize: FontSize.md, textAlign: 'center' }
});

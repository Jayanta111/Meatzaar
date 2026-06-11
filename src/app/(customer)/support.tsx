import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, Spacing } from '@/constants/theme';

export default function SupportScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Help & Support' }} />
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.textSecondary }]}>For support, please contact us at support@freshmeat.com</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  text: { fontSize: FontSize.md, textAlign: 'center' }
});

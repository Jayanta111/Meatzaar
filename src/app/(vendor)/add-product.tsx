import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

const CATEGORIES = ['Chicken', 'Mutton', 'Pork', 'Fish', 'Prawns', 'Eggs', 'Duck', 'Others'];

export default function AddProductScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Chicken');
  const [unit, setUnit] = useState('kg');
  const [imageUrl, setImageUrl] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !price || !category) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);

      const defaultImages: Record<string, string> = {
        Chicken:
          "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&auto=format&fit=crop&q=80",

        Mutton:
          "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&auto=format&fit=crop&q=80",

        Pork:
          "https://images.unsplash.com/photo-1628268909376-e8c46bb14c7c?w=800&auto=format&fit=crop&q=80",

        Fish:
          "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&auto=format&fit=crop&q=80",

        Prawns:
          "https://images.unsplash.com/photo-1565680018434-b513d7e5fd47?w=800&auto=format&fit=crop&q=80",

        Eggs:
          "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=800&auto=format&fit=crop&q=80",

        Duck:
          "https://images.unsplash.com/photo-1581331474665-a0b2eebefd18?w=800&auto=format&fit=crop&q=80",

        Others:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
      };

      const finalImage = imageUrl || defaultImages[category] || defaultImages['Others'];

      await api.post('/products', {
        name,
        price: parseFloat(price),
        category,
        unit,
        imageUrl: finalImage,
      });

      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add New Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Product Name *</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="e.g., Fresh Premium Chicken Breast"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Price (₹) *</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="e.g., 250"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.md }]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, {
                      backgroundColor: category === c ? theme.primary : theme.background,
                      borderColor: category === c ? theme.primary : theme.border,
                    }]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={{ color: category === c ? '#FFF' : theme.text }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Unit</Text>
            <View style={styles.row}>
              {['kg', 'grams', 'pieces', 'dozen'].map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.chip, {
                    backgroundColor: unit === u ? theme.primary : theme.background,
                    borderColor: unit === u ? theme.primary : theme.border,
                    marginRight: 8,
                  }]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={{ color: unit === u ? '#FFF' : theme.text }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Image URL (Optional)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="https://..."
              placeholderTextColor={theme.textMuted}
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
            />
            <Text style={{ fontSize: FontSize.xs, color: theme.textMuted, marginTop: 4 }}>
              Paste a direct image link. We will support camera uploads soon.
            </Text>
          </View>

        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom || Spacing.md }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600' },
  container: { flex: 1 },
  formCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.lg,
  },
  inputGroup: { gap: 8 },
  label: { fontSize: FontSize.sm, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: FontSize.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  chipsContainer: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  saveBtn: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});

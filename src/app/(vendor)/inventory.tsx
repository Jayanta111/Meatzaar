import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function InventoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Chicken', unit: 'kg' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/products/vendor');
      const productsArray = response.data?.data || response.data || [];
      setProducts(productsArray);
    } catch (err: any) {
      console.error('Failed to fetch products', err);
      // Don't show alert on 401 (logout case)
      if (err.response?.status !== 401) {
        Alert.alert('Error', 'Failed to fetch products');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/products/${productId}`, { isAvailable: !currentStatus });
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isAvailable: !currentStatus } : p
      ));
    } catch (err) {
      console.error('Failed to update availability', err);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Missing info', 'Please fill in name and price');
      return;
    }
    try {
      const payload: any = {
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        unit: newProduct.unit,
      };

      if (newProduct.category === 'Pork') {
        payload.imageUrl = 'https://images.pexels.com/photos/2676932/pexels-photo-2676932.jpeg';
      }

      await api.post('/products', payload);
      setNewProduct({ name: '', price: '', category: 'Chicken', unit: 'kg' });
      setShowAddForm(false);
      fetchProducts();
      Alert.alert('Success', 'Product added successfully');
    } catch (err) {
      console.error('Failed to add product', err);
      Alert.alert('Error', 'Failed to add product');
    }
  };

  const deleteProduct = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${productId}`);
              setProducts(prev => prev.filter(p => p.id !== productId));
            } catch (err) {
              console.error('Failed to delete product', err);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      Chicken: '🍗',
      Mutton: '🥩',
      Pork: '🥓',
      Fish: '🐟',
      Prawns: '🦐',
      Eggs: '🥚',
      Poultry: '🐓',
      Duck: '🦆',
      Others: '📦',
    };
    return emojis[category] || '📦';
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
            <Text style={[styles.title, { color: theme.text }]}>Inventory</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {products.length} products • {products.filter((p) => p.available).length} available
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => setShowAddForm(!showAddForm)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>{showAddForm ? '✕' : '+'}</Text>
          </TouchableOpacity>
        </View>

        {/* Add Product Form */}
        {showAddForm && (
          <View style={[styles.addForm, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>Add New Product</Text>

            <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Product Name"
                placeholderTextColor={theme.textMuted}
                value={newProduct.name}
                onChangeText={(v) => setNewProduct({ ...newProduct, name: v })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputRow, styles.halfInput, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Price"
                  placeholderTextColor={theme.textMuted}
                  value={newProduct.price}
                  onChangeText={(v) => setNewProduct({ ...newProduct, price: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputRow, styles.halfInput, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Unit (kg, dozen)"
                  placeholderTextColor={theme.textMuted}
                  value={newProduct.unit}
                  onChangeText={(v) => setNewProduct({ ...newProduct, unit: v })}
                />
              </View>
            </View>

            {/* Category pills */}
            <View style={styles.categoryRow}>
              {['Chicken', 'Mutton', 'Pork', 'Fish', 'Eggs', 'Poultry', 'Duck'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: newProduct.category === cat ? theme.primary : theme.backgroundElement,
                      borderColor: newProduct.category === cat ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setNewProduct({ ...newProduct, category: cat })}
                >
                  <Text style={{ color: newProduct.category === cat ? '#FFF' : theme.text, fontSize: FontSize.xs, fontWeight: '600' }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.secondary }]}
              onPress={addProduct}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Product List */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No products in your inventory</Text>
          </View>
        ) : (
          products.map((product) => (
            <View
              key={product.id}
              style={[
                styles.productCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  opacity: product.isAvailable ? 1 : 0.6,
                },
              ]}
            >
              <View style={[styles.productEmoji, { backgroundColor: `${theme.primary}10` }]}>
                <Text style={{ fontSize: 28 }}>{getCategoryEmoji(product.category)}</Text>
              </View>

              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                <Text style={[styles.productMeta, { color: theme.textMuted }]}>
                  {product.category} • ₹{product.price}/{product.unit}
                </Text>
              </View>

              <View style={styles.actionColumn}>
                <Switch
                  value={product.isAvailable}
                  onValueChange={() => toggleAvailability(product.id, product.isAvailable)}
                  trackColor={{ true: theme.secondary, false: theme.backgroundElement }}
                  thumbColor="#FFF"
                />
                <Text style={[styles.toggleLabel, { color: product.isAvailable ? theme.secondary : theme.textMuted }]}>
                  {product.isAvailable ? 'In Stock' : 'Out'}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteProduct(product.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  title: { fontSize: FontSize['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.sm, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  // Add Form
  addForm: {
    marginHorizontal: Spacing['3xl'],
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing['2xl'],
  },
  formTitle: { fontSize: FontSize.lg, fontWeight: '800', marginBottom: Spacing.xl },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  currencySymbol: { fontSize: FontSize.md, marginRight: Spacing.sm, color: '#888' },
  input: { flex: 1, fontSize: FontSize.md, paddingVertical: Spacing.sm },
  formRow: { flexDirection: 'row', gap: Spacing.lg },
  halfInput: { flex: 1 },
  categoryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl, flexWrap: 'wrap' },
  categoryPill: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  saveBtn: {
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '700' },
  // Product Card
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['3xl'],
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  productEmoji: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.md, fontWeight: '700' },
  productMeta: { fontSize: FontSize.xs, marginTop: 2 },
  toggleColumn: { alignItems: 'center' },
  actionColumn: { alignItems: 'center', gap: Spacing.sm },
  toggleLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  deleteBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: FontSize.md },
});

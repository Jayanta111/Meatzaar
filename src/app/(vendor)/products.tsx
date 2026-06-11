import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

export default function VendorProducts() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      // Fetch vendor-specific products from the new endpoint
      const response = await api.get('/products/vendor');
      // Handle paginated response structure: { data: [...], pagination: {...} }
      const productsArray = response.data?.data || response.data || [];
      setProducts(productsArray);
    } catch (err) {
      console.error('Failed to fetch products', err);
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
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }: { item: any }) => (
    <View style={[styles.productCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.productCategory, { color: theme.textSecondary }]}>{item.category} • {item.unit}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.productPrice, { color: theme.primary }]}>₹{item.price}</Text>
          <View style={styles.availabilityToggle}>
            <Switch
              value={item.isAvailable}
              onValueChange={() => toggleAvailability(item.id, item.isAvailable)}
              trackColor={{ false: theme.border, true: theme.secondary }}
              thumbColor={item.isAvailable ? '#FFF' : theme.border}
            />
            <Text style={[styles.availabilityText, { color: item.isAvailable ? theme.secondary : theme.textSecondary }]}>
              {item.isAvailable ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: theme.primary + '15' }]}
          onPress={() => router.push('/add-product')}
        >
          <Ionicons name="pencil" size={18} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#EF444415' }]}
          onPress={() => deleteProduct(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>My Catalog</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage your products and pricing</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/add-product')}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search products..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>{products.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Products</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: theme.secondary }]}>{products.filter(p => p.isAvailable).length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{products.filter(p => !p.isAvailable).length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Inactive</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery ? 'No products found' : 'No products in your catalog yet.'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/add-product')}
                >
                  <Text style={styles.emptyBtnText}>Add Your First Product</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
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
  subtitle: { fontSize: FontSize.sm, marginTop: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: FontSize.sm },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: { fontSize: FontSize.xl, fontWeight: '700' },
  statLabel: { fontSize: FontSize.xs, marginTop: 4 },
  list: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.md },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  productImage: { width: 60, height: 60, borderRadius: BorderRadius.md },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 4 },
  productCategory: { fontSize: FontSize.sm, marginBottom: 4 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: { fontSize: FontSize.md, fontWeight: '700' },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  availabilityText: { fontSize: FontSize.xs, fontWeight: '600' },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    padding: 10,
    borderRadius: 12,
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: FontSize.md },
  emptyBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '600' },
});

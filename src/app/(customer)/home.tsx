import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  Dimensions,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import api from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

// Optional location import - will fail gracefully if not available
let Location: any = null;
try {
  Location = require('expo-location');
} catch (e) {
  console.warn('expo-location not available, location features disabled');
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing['3xl'] * 2 - Spacing.lg) / 2;

const CATEGORIES = [
  { id: '1', name: 'All', emoji: '🍖' },
  { id: '2', name: 'Chicken', emoji: '🐔' },
  { id: '3', name: 'Mutton', emoji: '🐐' },
  { id: 'pork', name: 'Pork', emoji: '🐷' },
  { id: '4', name: 'Fish', emoji: '🐟' },
  { id: '5', name: 'Prawns', emoji: '🦐' },
  { id: '6', name: 'Eggs', emoji: '🥚' },
  { id: '7', name: 'Duck', emoji: '🦆' },
];

const DEALS = [
  { id: 'd1', title: '🔥 50% Off First Order', subtitle: 'Use code FRESH50', gradient: ['#E53935', '#FF6F61'] },
  { id: 'd2', title: '🐔 Chicken Festival', subtitle: 'Flat ₹100 off on all chicken', gradient: ['#F59E0B', '#F97316'] },
  { id: 'd3', title: '🚚 Free Delivery', subtitle: 'On orders above ₹500', gradient: ['#10B981', '#059669'] },
];

export default function CustomerHome() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addItem, items } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');
  const [unsupportedLocation, setUnsupportedLocation] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    (async () => {
      if (!Location) {
        setLocationName('Location not available');
        fetchProducts(null, null);
        return;
      }

      // 1. Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Location permission denied');
        fetchProducts(null, null);
        return;
      }

      try {
        // 2. Get real GPS coordinates
        let location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;

        // 3. Reverse geocode to get city/street name
        let address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (address && address.length > 0) {
          const loc = address[0];
          setLocationName(`${loc.street || loc.district || ''}, ${loc.city || loc.region || ''}`);
        } else {
          setLocationName('Unknown Location');
        }

        // 4. Fetch nearby products using real coordinates
        fetchProducts(lat, lng);
      } catch (error) {
        console.error('Location error:', error);
        setLocationName('Failed to get location');
        fetchProducts(null, null);
      }
    })();
  }, []);

  const fetchProducts = async (lat: number | null, lng: number | null) => {
    try {
      setLoading(true);
      // Pass real location if available, otherwise fallback
      const url = lat && lng ? `/products?lat=${lat}&lng=${lng}` : '/products';
      const response = await api.get(url);
      
      setUnsupportedLocation(response.data?.unsupportedLocation || false);
      
      // Handle paginated response structure: { data: [...], pagination: {...} }
      const productsArray = response.data?.data || response.data || [];
      // response.data includes { vendor: { shopName: ..., avgRating: ... } }
      const formatted = productsArray.map((p: any) => ({
        ...p,
        vendorName: p.vendor?.shopName || 'Unknown Vendor',
        vendorRating: p.vendor?.avgRating || 0,
        vendorDistance: p.vendor?.distance || null
      }));
      setProducts(formatted);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getCartQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const renderDealCard = ({ item }: { item: typeof DEALS[0] }) => (
    <View style={[styles.dealCard, { backgroundColor: item.gradient[0] }]}>
      <Text style={styles.dealTitle}>{item.title}</Text>
      <Text style={styles.dealSubtitle}>{item.subtitle}</Text>
      <TouchableOpacity style={styles.dealBtn}>
        <Text style={styles.dealBtnText}>Shop Now →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProductCard = ({ item }: { item: typeof products[0] }) => {
    const qty = getCartQuantity(item.id);

    return (
      <View style={[styles.productCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {qty > 0 && (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>{qty}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {/* Vendor Name and Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
            <Text style={[styles.vendorLabel, { color: theme.textMuted }]} numberOfLines={1}>
              {item.vendorName}
            </Text>
            {item.vendorRating > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={{ fontSize: FontSize.xs, color: theme.text, marginLeft: 2, fontWeight: '600' }}>
                  {item.vendorRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          
          {item.vendorDistance !== null && (
            <Text style={{ fontSize: FontSize.xs, color: theme.primary, marginBottom: Spacing.xs, fontWeight: '500' }}>
              {item.vendorDistance < 1 ? '< 1 km away' : `${item.vendorDistance.toFixed(1)} km away`}
            </Text>
          )}

          <View style={styles.productBottom}>
            <View>
              <Text style={[styles.productPrice, { color: theme.primary }]}>
                ₹{item.price}
              </Text>
              <Text style={[styles.productUnit, { color: theme.textMuted }]}>
                per {item.unit}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
              onPress={() =>
                addItem({
                  productId: item.id,
                  name: item.name,
                  price: item.price,
                  unit: item.unit,
                  vendorName: item.vendorName,
                })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <Animated.ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Blinkit-style Location Header */}
          <View style={styles.locationHeader}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={24} color="#FFF" />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={[styles.locationTitle, { color: theme.textSecondary }]}>Delivery in 15 mins</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.locationAddress, { color: theme.text }]} numberOfLines={1}>
                  {locationName || user?.address || 'Locating...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.text} style={{ marginLeft: 4 }} />
              </View>
            </View>
            <TouchableOpacity style={styles.profileBtn}>
              <Image 
                source={{ uri: user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}` }} 
                style={styles.profileAvatar} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Fresh Meat, </Text>
            <Text style={[styles.title, { color: theme.primary }]}>Delivered Fast.</Text>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search chicken, mutton, fish..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Deals Carousel */}
          <FlatList
            data={DEALS}
            renderItem={renderDealCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dealsContainer}
            snapToInterval={width - Spacing['3xl'] * 2 + Spacing.lg}
            decelerationRate="fast"
          />

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      { color: isSelected ? '#FFF' : theme.text, fontWeight: isSelected ? '700' : '600' },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {selectedCategory === 'All' ? 'Popular Items' : selectedCategory}
            </Text>
            <Text style={[styles.sectionCount, { color: theme.textMuted }]}>
              {filteredProducts.length} items
            </Text>
          </View>

          {/* Products Grid */}
          <View style={styles.productsGrid}>
            {loading ? (
              <View style={{ flex: 1, padding: Spacing['3xl'], alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : unsupportedLocation && filteredProducts.length === 0 ? (
              <View style={{ padding: Spacing.xl, borderRadius: BorderRadius.lg, backgroundColor: `${theme.error}15`, marginTop: Spacing.xl, marginHorizontal: Spacing['3xl'] }}>
                <Ionicons name="sad-outline" size={48} color={theme.error} style={{ marginBottom: Spacing.md, alignSelf: 'center' }} />
                <Text style={{ color: theme.error, textAlign: 'center', fontSize: FontSize.md, fontWeight: '600' }}>
                  We are not currently operating in your location. Coming soon!
                </Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                <Ionicons name="search-outline" size={48} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, marginTop: Spacing.md }}>No products found.</Text>
              </View>
            ) : (
              filteredProducts.map((product) => (
                <View key={product.id} style={styles.productGridItem}>
                  {renderProductCard({ item: product })}
                  
                </View>
              ))
            )}
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: { 
    marginBottom: Spacing.xl, 
    paddingHorizontal: Spacing['3xl'],
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing['3xl'],
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: { flex: 1 },
  locationTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  locationAddress: { fontSize: 15, fontWeight: '600' },
  profileBtn: { marginLeft: 'auto' },
  profileAvatar: { width: 40, height: 40, borderRadius: 20 },
  title: { fontSize: FontSize['2xl'], fontWeight: '800' },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['3xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
  },
  // Deals
  dealsContainer: {
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  dealCard: {
    width: width - Spacing['3xl'] * 2,
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
  },
  dealTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: Spacing.sm,
  },
  dealSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing.xl,
  },
  dealBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  dealBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  // Categories
  categoriesContainer: {
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.md,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: FontSize.sm,
  },
  // Products
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.lg,
  },
  productGridItem: {
    width: CARD_WIDTH,
  },
  productCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  qtyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  qtyBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  productInfo: {
    padding: Spacing.lg,
  },
  productName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  vendorLabel: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  productUnit: {
    fontSize: FontSize.xs,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
});

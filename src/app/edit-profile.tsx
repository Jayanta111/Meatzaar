import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';
import api from '@/lib/api';

export default function EditProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, setAuth } = useAuthStore();
  const token = useAuthStore((state) => state.token);

  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [vendorType, setVendorType] = useState(user?.vendorType || 'MEAT_SHOP');
  const [latitude, setLatitude] = useState<number | null>(user?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(user?.longitude || null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      const data = res.data;
      if (data) {
        setName(data.name || '');
        setAddress(data.address || '');
        setAvatarUrl(data.avatarUrl || '');
        setShopName(data.shopName || '');
        setVendorType(data.vendorType || 'MEAT_SHOP');
        setLatitude(data.latitude || null);
        setLongitude(data.longitude || null);
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    
    setLoading(true);
    try {
      const payload: any = { name, address, avatarUrl };
      if (user?.role === 'VENDOR') {
        payload.shopName = shopName;
        payload.vendorType = vendorType;
        if (latitude !== null) payload.latitude = latitude;
        if (longitude !== null) payload.longitude = longitude;
      }

      const res = await api.put('/user/profile', payload);
      const updatedUser = res.data;
      
      // Update global auth store with new user data
      if (token) {
        setAuth(updatedUser, token);
      }
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to set your store coordinates.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      
      // Also optionally reverse geocode to update the address string
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (geocode && geocode.length > 0) {
        const addr = `${geocode[0].name || ''} ${geocode[0].street || ''}, ${geocode[0].city || ''}`.trim();
        if (addr.length > 2) setAddress(addr);
      }
    } catch (error) {
      Alert.alert('Location Error', 'Failed to fetch current location.');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Delivery Address</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, Apartment 4B"
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Avatar URL (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://example.com/avatar.jpg"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {user?.role === 'VENDOR' && (
          <View style={styles.vendorSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Store Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Shop Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
                value={shopName}
                onChangeText={setShopName}
                placeholder="Fresh Meat Co."
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Vendor Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity 
                  style={[styles.typeBtn, vendorType === 'MEAT_SHOP' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }]}
                  onPress={() => setVendorType('MEAT_SHOP')}
                >
                  <Text style={[styles.typeText, { color: vendorType === 'MEAT_SHOP' ? '#FFF' : theme.text }]}>Meat Shop</Text>
                  <Text style={[styles.typeSubText, { color: vendorType === 'MEAT_SHOP' ? 'rgba(255,255,255,0.8)' : theme.textMuted }]}>7km radius</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, vendorType === 'POULTRY_FARM' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }]}
                  onPress={() => setVendorType('POULTRY_FARM')}
                >
                  <Text style={[styles.typeText, { color: vendorType === 'POULTRY_FARM' ? '#FFF' : theme.text }]}>Poultry Farm</Text>
                  <Text style={[styles.typeSubText, { color: vendorType === 'POULTRY_FARM' ? 'rgba(255,255,255,0.8)' : theme.textMuted }]}>30km radius</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Store GPS Location</Text>
              <View style={styles.locationContainer}>
                {latitude && longitude ? (
                  <View style={styles.coordsContainer}>
                    <Text style={[styles.coordsText, { color: theme.text }]}>Lat: {latitude.toFixed(5)}</Text>
                    <Text style={[styles.coordsText, { color: theme.text }]}>Lng: {longitude.toFixed(5)}</Text>
                  </View>
                ) : (
                  <Text style={[styles.noLocationText, { color: theme.error }]}>Location not set!</Text>
                )}
                
                <TouchableOpacity 
                  style={[styles.locationBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  onPress={handleGetLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Text style={[styles.locationBtnText, { color: theme.text }]}>
                      {latitude ? 'Update Location' : 'Use Current Location'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={[styles.helpText, { color: theme.textMuted }]}>
                Customers will only see your store if they are within your delivery radius.
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing['2xl'],
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  vendorSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xl,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  typeText: {
    fontWeight: '700',
    fontSize: FontSize.sm,
    marginBottom: 2,
  },
  typeSubText: {
    fontSize: FontSize.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  coordsContainer: {
    flex: 1,
  },
  coordsText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  noLocationText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  locationBtn: {
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  locationBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  helpText: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  }
});

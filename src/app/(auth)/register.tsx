import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, UserRole } from '@/store/auth-store';
import { Colors, FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [shopName, setShopName] = useState('');

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) return;
    if (password !== confirmPassword) {
      useAuthStore.setState({ error: 'Passwords do not match' });
      return;
    }
    if (role === 'VENDOR' && !shopName.trim()) {
      useAuthStore.setState({ error: 'Shop name is required for vendors' });
      return;
    }

    clearError();
    const success = await register({
      name,
      phone,
      password,
      role,
      shopName: role === 'VENDOR' ? shopName : undefined,
    });

    if (success) {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: theme.text }]}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, alignItems: 'center' }]}>
            <Image 
              source={require('../../../assets/images/Chicken.png')} 
              style={{ width: 80, height: 80, marginBottom: 16 }} 
              resizeMode="contain" 
            />
            <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
              Join the Meatzaar family today
            </Text>
          </Animated.View>

          {/* Role Selector */}
          <Animated.View
            style={[
              styles.roleSelector,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.roleBtn,
                {
                  backgroundColor:
                    role === 'CUSTOMER' ? theme.secondary : theme.backgroundElement,
                  borderColor: role === 'CUSTOMER' ? theme.secondary : theme.border,
                },
              ]}
              onPress={() => setRole('CUSTOMER')}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>🛒</Text>
              <Text
                style={[
                  styles.roleText,
                  { color: role === 'CUSTOMER' ? '#FFF' : theme.text },
                ]}
              >
                Customer
              </Text>
              <Text
                style={[
                  styles.roleDesc,
                  { color: role === 'CUSTOMER' ? 'rgba(255,255,255,0.8)' : theme.textMuted },
                ]}
              >
                Order fresh meat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleBtn,
                {
                  backgroundColor:
                    role === 'VENDOR' ? theme.primary : theme.backgroundElement,
                  borderColor: role === 'VENDOR' ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setRole('VENDOR')}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>🏪</Text>
              <Text
                style={[
                  styles.roleText,
                  { color: role === 'VENDOR' ? '#FFF' : theme.text },
                ]}
              >
                Vendor
              </Text>
              <Text
                style={[
                  styles.roleDesc,
                  { color: role === 'VENDOR' ? 'rgba(255,255,255,0.8)' : theme.textMuted },
                ]}
              >
                Sell your products
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {error && (
              <View style={[styles.errorBanner, { backgroundColor: `${theme.error}15` }]}>
                <Text style={[styles.errorText, { color: theme.error }]}>⚠️ {error}</Text>
              </View>
            )}

            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Phone Number"
                placeholderTextColor={theme.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {role === 'VENDOR' && (
              <View style={[styles.inputContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Text style={styles.inputIcon}>🏪</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Shop Name"
                  placeholderTextColor={theme.textMuted}
                  value={shopName}
                  onChangeText={setShopName}
                />
              </View>
            )}

            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: role === 'VENDOR' ? theme.primary : theme.secondary },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {role === 'VENDOR' ? 'Register as Vendor' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {role === 'VENDOR' && (
              <Text style={[styles.vendorNote, { color: theme.textMuted }]}>
                ℹ️ Vendor accounts require admin approval before activation
              </Text>
            )}

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.back()}
            >
              <Text style={[styles.loginText, { color: theme.textSecondary }]}>
                Already have an account?{' '}
                <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: Spacing['5xl'],
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  header: {
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing['3xl'],
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  roleEmoji: {
    fontSize: 28,
  },
  roleText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  roleDesc: {
    fontSize: FontSize.xs,
  },
  formContainer: {},
  errorBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Platform.OS === 'ios' ? Spacing.xl : Spacing.sm,
    marginBottom: Spacing.lg,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  primaryBtn: {
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vendorNote: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: Spacing['3xl'],
    paddingVertical: Spacing.xl,
  },
  loginText: {
    fontSize: FontSize.md,
  },
});

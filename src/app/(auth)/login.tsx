import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { Colors, FontSize, BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) return;
    clearError();
    const success = await login(phone, password);
    if (success) {
      router.replace('/');
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top gradient decoration */}
        <View style={[styles.topDecoration, { backgroundColor: theme.primary }]}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
        </View>

        {/* Logo & Title */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ scale: logoScale }] },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/Chicken.png')}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Meatzaar</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Farm-fresh meat, delivered to your door
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: `${theme.error}15` }]}>
              <Text style={[styles.errorText, { color: theme.error }]}>⚠️ {error}</Text>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Phone Number"
              placeholderTextColor={theme.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Text style={styles.eyeIcon}>{passwordVisible ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>


          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={[styles.registerText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
    justifyContent: 'center',
  },
  topDecoration: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 1.4,
    height: height * 0.43,
    borderBottomLeftRadius: 250,
    borderBottomRightRadius: 250,
    opacity: 0.08,
  },
  decorCircle1: {
    position: 'absolute',
    bottom: 60,
    right: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    marginBottom: Spacing['4xl'],
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: FontSize['4xl'],
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: Spacing['3xl'],
  },
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
  eyeIcon: {
    fontSize: 18,
    paddingLeft: Spacing.md,
  },
  primaryBtn: {
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: Spacing['4xl'],
    paddingVertical: Spacing.xl,
  },
  registerText: {
    fontSize: FontSize.md,
  },
});

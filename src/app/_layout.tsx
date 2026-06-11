import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const MeatzaarDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#FF5252',
    background: '#0F0F1A',
    card: '#16162A',
    text: '#F9FAFB',
    border: '#2A2A3E',
    notification: '#FF5252',
  },
};

const MeatzaarLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#E53935',
    background: '#FAFAFA',
    card: '#FFFFFF',
    text: '#1A1A2E',
    border: '#E5E7EB',
    notification: '#E53935',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? MeatzaarDark : MeatzaarLight;

  return (
    <ErrorBoundary>
      <ThemeProvider value={theme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(vendor)" />
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

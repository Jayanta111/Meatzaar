import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === 'VENDOR') {
    return <Redirect href="/(vendor)/dashboard" />;
  }

  return <Redirect href="/(customer)/home" />;
}

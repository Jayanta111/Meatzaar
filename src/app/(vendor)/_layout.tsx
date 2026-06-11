import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { FontSize } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

function TabIcon({ icon, focused, color }: { icon: any; focused: boolean; color: string }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Ionicons name={icon} size={24} color={color} style={{ opacity: focused ? 1 : 0.6 }} />
    </View>
  );
}

export default function VendorLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="document-text-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="cube-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="wallet-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="grid-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendor-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="person-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="add-product" options={{ href: null }} />
       <Tabs.Screen name="payment-methods" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  tabIconFocused: {
    transform: [{ scale: 1.15 }],
  },
  tabEmoji: {
    fontSize: 22,
  },
});

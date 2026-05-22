import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { Bell, Home, MessageCircle, PlusCircle, User } from 'lucide-react-native';

import { useAuth } from '@/lib/hooks/useAuth';

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View className="flex-1 bg-background" />;
  if (!user) return <Redirect href="/auth" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'hsl(207 90% 54%)',
        tabBarInactiveTintColor: 'hsl(213 20% 46%)',
        tabBarStyle: {
          backgroundColor: 'hsl(0 0% 100%)',
          borderTopColor: 'hsl(210 15% 87%)',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Geef weg',
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Meldingen',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profiel',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

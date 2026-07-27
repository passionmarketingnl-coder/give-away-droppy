import { Redirect, Tabs } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Home, MessageCircle, Plus, User } from 'lucide-react-native';

import { useAuth } from '@/lib/hooks/useAuth';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) return <View className="flex-1 bg-background" />;
  if (!user) return <Redirect href="/auth" />;

  // Op iOS/Android voegen we bottom safe-area toe zodat labels niet
  // achter de home-indicator vallen. Op web is insets.bottom = 0 → 12px
  // padding om labels vrij te laten ademen.
  const bottomInset = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'hsl(231 100% 71%)',
        tabBarInactiveTintColor: 'hsl(233 15% 60%)',
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: 'hsl(0 0% 100%)',
          borderTopColor: 'hsl(232 15% 90%)',
          height: 60 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
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
          title: '',
          tabBarButton: (props) => (
            <Pressable
              onPress={props.onPress as any}
              className="flex-1 items-center justify-center"
              style={{ marginTop: -18 }}>
              <View
                className="w-14 h-14 rounded-full bg-droppi-pink items-center justify-center"
                style={Platform.select({
                  ios: {
                    shadowColor: '#F65FE7',
                    shadowOpacity: 0.45,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 8 },
                  },
                  android: { elevation: 10 },
                  web: { boxShadow: '0 10px 22px rgba(246,95,231,0.45)' } as any,
                })}>
                <Plus size={28} color="#ffffff" strokeWidth={3} />
              </View>
            </Pressable>
          ),
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

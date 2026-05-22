import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '@/lib/hooks/useAuth';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View className="flex-1 bg-background" />;
  if (user) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

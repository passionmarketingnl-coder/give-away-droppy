import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts as useYanone, YanoneKaffeesatz_500Medium, YanoneKaffeesatz_600SemiBold, YanoneKaffeesatz_700Bold } from '@expo-google-fonts/yanone-kaffeesatz';
import { useFonts as usePoppins, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient();

function AppShell() {
  // Registreert push token zodra user ingelogd is en luistert op notification taps.
  // No-op op web (Platform.OS check binnen de hook).
  usePushNotifications();

  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" options={{ headerShown: true, title: 'Post' }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Chat' }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: true, title: 'Profiel bewerken' }} />
      </Stack>
      <StatusBar style="auto" />
      <PortalHost />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [yanoneLoaded] = useYanone({
    YanoneKaffeesatz_500Medium,
    YanoneKaffeesatz_600SemiBold,
    YanoneKaffeesatz_700Bold,
  });
  const [poppinsLoaded] = usePoppins({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!yanoneLoaded || !poppinsLoaded) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}

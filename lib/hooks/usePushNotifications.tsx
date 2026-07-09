import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

// Notifications zichtbaar maken terwijl de app in de foreground draait.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function requestPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null; // simulators kunnen geen tokens ontvangen

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId ??
    Constants.expoConfig?.slug;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (e) {
    console.warn('Expo push token ophalen mislukt', e);
    return null;
  }
}

async function registerToken(userId: string, token: string) {
  const platform = Platform.OS;
  // Upsert: één rij per unieke token, koppel aan huidige user.
  await supabase
    .from('user_push_tokens')
    .upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    );
}

/**
 * Client-side push registratie. Aanroepen binnen AuthProvider zodra user ingelogd is.
 * Op web: skip (Web Push is aparte implementatie, komt later).
 * Op iOS/Android: vraag permission → verkrijg token → sla op in Supabase.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const registered = useRef(false);

  // Register token wanneer user beschikbaar is.
  useEffect(() => {
    if (!user || registered.current) return;
    if (Platform.OS === 'web') return;

    let cancelled = false;
    (async () => {
      const granted = await requestPermission();
      if (!granted || cancelled) return;

      // Android channel: verplicht voor 8.0+ om notifications zichtbaar te maken
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Droppi meldingen',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      const token = await getExpoPushToken();
      if (!token || cancelled) return;

      try {
        await registerToken(user.id, token);
        registered.current = true;
      } catch (e) {
        console.warn('Push token opslaan in Supabase mislukt', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Handle tap op notification: navigeren naar juiste route op basis van data-payload.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        type?: string;
        post_id?: string;
        conversation_id?: string;
      };

      if (data.conversation_id) {
        router.push(`/chat/${data.conversation_id}`);
        return;
      }
      if (data.post_id) {
        router.push(`/post/${data.post_id}`);
        return;
      }
      // Fallback: open Meldingen tab
      router.push('/notifications');
    });

    return () => sub.remove();
  }, [router]);
}

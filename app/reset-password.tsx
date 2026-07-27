import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Loader2, Lock } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

type Phase = 'checking' | 'ready' | 'saving' | 'done' | 'invalid';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [phase, setPhase] = useState<Phase>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Supabase JS pikt de recovery token uit de URL hash zelf op als
  // detectSessionInUrl aan staat (op web). Dan is er tijdelijk een sessie
  // waarmee we het wachtwoord mogen updaten.
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setPhase('ready');
    } else {
      setPhase('invalid');
    }
  }, [authLoading, user]);

  const handleSave = async () => {
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg('Wachtwoord moet minimaal 6 tekens zijn.');
      return;
    }
    if (password !== password2) {
      setErrorMsg('Wachtwoorden komen niet overeen.');
      return;
    }
    setPhase('saving');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMsg(`Opslaan mislukt: ${error.message}`);
      setPhase('ready');
      return;
    }
    setPhase('done');
    setTimeout(() => router.replace('/'), 1500);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 max-w-lg w-full mx-auto px-6 pt-16">
          {phase === 'checking' && (
            <View className="items-center justify-center flex-1">
              <Loader2 size={32} color="hsl(231 100% 71%)" />
            </View>
          )}

          {phase === 'invalid' && (
            <View className="items-center justify-center flex-1">
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(228,72,72,0.24)',
                  borderRadius: 24,
                  overflow: 'hidden',
                  width: '100%',
                  maxWidth: 340,
                }}>
                <LinearGradient
                  colors={['rgba(228,72,72,0.14)', 'rgba(246,95,231,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 24, alignItems: 'center', gap: 12 }}>
                  <Text className="text-2xl font-heading text-foreground text-center">
                    Reset-link niet geldig
                  </Text>
                  <Text className="text-muted-foreground text-center max-w-xs">
                    De link is verlopen of niet correct. Vraag een nieuwe reset-link aan
                    via het inlog-scherm.
                  </Text>
                  <Button
                    onPress={() => router.replace('/auth')}
                    variant="outline"
                    className="mt-2 h-12 rounded-full px-8 bg-white">
                    <Text>Naar inloggen</Text>
                  </Button>
                </LinearGradient>
              </View>
            </View>
          )}

          {(phase === 'ready' || phase === 'saving') && (
            <View>
              <Text className="text-3xl font-heading text-foreground mb-2">
                Nieuw wachtwoord
              </Text>
              <Text className="text-muted-foreground mb-8">
                Kies een nieuw wachtwoord voor je Droppi account.
              </Text>
              <View className="gap-4">
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Lock size={18} color="hsl(232 15% 55%)" />
                  </View>
                  <Input
                    placeholder="Nieuw wachtwoord"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    className="pl-11 h-12 rounded-full"
                  />
                </View>
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Lock size={18} color="hsl(232 15% 55%)" />
                  </View>
                  <Input
                    placeholder="Bevestig wachtwoord"
                    value={password2}
                    onChangeText={setPassword2}
                    secureTextEntry
                    autoComplete="new-password"
                    className="pl-11 h-12 rounded-full"
                  />
                </View>
              </View>
              {errorMsg && (
                <View className="mt-4 p-3 rounded-2xl bg-destructive/10 border border-destructive">
                  <Text className="text-sm text-destructive">{errorMsg}</Text>
                </View>
              )}
              <Pressable
                onPress={handleSave}
                disabled={phase === 'saving'}
                className={`w-full mt-6 h-14 rounded-full overflow-hidden ${
                  phase === 'saving' ? 'opacity-70' : ''
                }`}
                style={Platform.select({
                  ios: {
                    shadowColor: '#F65FE7',
                    shadowOpacity: 0.45,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                  },
                  android: { elevation: 8 },
                  web: { boxShadow: '0 8px 22px rgba(246,95,231,0.45)' } as any,
                })}>
                <LinearGradient
                  colors={['#6880FF', '#F65FE7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}>
                  {phase === 'saving' ? (
                    <Loader2 size={20} color="white" />
                  ) : (
                    <Text className="font-poppins-700 text-base text-white">
                      Wachtwoord opslaan
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => router.replace('/auth')}
                className="mt-4">
                <Text className="text-sm text-primary font-poppins-600 text-center">
                  Annuleer en ga terug
                </Text>
              </Pressable>
            </View>
          )}

          {phase === 'done' && (
            <View className="items-center justify-center flex-1">
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(63,159,82,0.28)',
                  borderRadius: 24,
                  overflow: 'hidden',
                  width: '100%',
                  maxWidth: 340,
                }}>
                <LinearGradient
                  colors={['rgba(159,250,127,0.28)', 'rgba(159,250,127,0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 24, alignItems: 'center', gap: 12 }}>
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
                    <CheckCircle size={30} color="#3F9F52" />
                  </View>
                  <Text className="text-2xl font-heading text-foreground text-center">
                    Wachtwoord bijgewerkt
                  </Text>
                  <Text className="text-muted-foreground text-center max-w-xs">
                    Je bent nu ingelogd, we sturen je door naar de feed.
                  </Text>
                </LinearGradient>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

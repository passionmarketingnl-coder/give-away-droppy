import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
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
              <Loader2 size={32} color="hsl(207 90% 54%)" />
            </View>
          )}

          {phase === 'invalid' && (
            <View className="items-center justify-center flex-1 gap-4">
              <Text className="text-2xl font-extrabold text-foreground text-center">
                Reset-link niet geldig
              </Text>
              <Text className="text-muted-foreground text-center max-w-xs">
                De link is verlopen of niet correct. Vraag een nieuwe reset-link aan
                via het inlog-scherm.
              </Text>
              <Button
                onPress={() => router.replace('/auth')}
                variant="outline"
                className="mt-4 h-12 rounded-xl px-8">
                <Text>Naar inloggen</Text>
              </Button>
            </View>
          )}

          {(phase === 'ready' || phase === 'saving') && (
            <View>
              <Text className="text-2xl font-extrabold text-foreground mb-2">
                Nieuw wachtwoord
              </Text>
              <Text className="text-muted-foreground mb-8">
                Kies een nieuw wachtwoord voor je Droppi account.
              </Text>
              <View className="gap-4">
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Lock size={20} color="hsl(213 20% 46%)" />
                  </View>
                  <Input
                    placeholder="Nieuw wachtwoord"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    className="pl-12 h-14 rounded-xl"
                  />
                </View>
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Lock size={20} color="hsl(213 20% 46%)" />
                  </View>
                  <Input
                    placeholder="Bevestig wachtwoord"
                    value={password2}
                    onChangeText={setPassword2}
                    secureTextEntry
                    autoComplete="new-password"
                    className="pl-12 h-14 rounded-xl"
                  />
                </View>
              </View>
              {errorMsg && (
                <View className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive">
                  <Text className="text-sm text-destructive">{errorMsg}</Text>
                </View>
              )}
              <Button
                onPress={handleSave}
                className="w-full mt-6 h-14 rounded-xl"
                disabled={phase === 'saving'}>
                {phase === 'saving' ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <Text className="font-bold">Wachtwoord opslaan</Text>
                )}
              </Button>
              <Pressable
                onPress={() => router.replace('/auth')}
                className="mt-4">
                <Text className="text-sm text-primary font-semibold text-center">
                  Annuleer en ga terug
                </Text>
              </Pressable>
            </View>
          )}

          {phase === 'done' && (
            <View className="items-center justify-center flex-1 gap-3">
              <View className="w-16 h-16 rounded-full bg-droppy-success/10 items-center justify-center mb-2">
                <CheckCircle size={32} color="hsl(123 89% 41%)" />
              </View>
              <Text className="text-2xl font-extrabold text-foreground text-center">
                Wachtwoord bijgewerkt
              </Text>
              <Text className="text-muted-foreground text-center max-w-xs">
                Je bent nu ingelogd, we sturen je door naar de feed.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

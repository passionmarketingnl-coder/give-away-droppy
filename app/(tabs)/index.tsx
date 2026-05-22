import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase/client';

export default function HomeScreen() {
  const [status, setStatus] = useState<string>('Verbinding maken...');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1) Client geïnitialiseerd? getSession() raakt geen tabel, alleen auth-token.
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) {
          setStatus(`❌ Auth fout: ${error.message}`);
          return;
        }
        const sessionInfo = data.session
          ? `ingelogd als ${data.session.user.email}`
          : 'nog geen sessie (verwacht — Auth-pagina komt nog)';
        setStatus(`✅ Supabase client werkt — ${sessionInfo}`);
      } catch (e: any) {
        if (cancelled) return;
        setStatus(`❌ Exception: ${e?.message || String(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="bg-card rounded-2xl p-8 w-full max-w-sm gap-3">
        <Text className="text-2xl font-extrabold text-foreground text-center">
          Supabase test
        </Text>
        <Text className="text-sm text-muted-foreground text-center">{status}</Text>
        <Button>
          <Text>RNR knop (referentie)</Text>
        </Button>
      </View>
    </View>
  );
}

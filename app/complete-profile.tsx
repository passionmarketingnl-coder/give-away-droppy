import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Loader2 } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

/**
 * Profiel afmaken na OAuth-login (Google/Apple). Deze gebruikers hebben
 * de registratie-stap overgeslagen en missen dus:
 * - postcode + huisnummer (nodig voor de 7km-kern van de app)
 * - telefoonnummer
 * - akkoord op voorwaarden/privacy (P7 store-compliance)
 * (tabs)/_layout stuurt ze hierheen zolang postcode in de metadata mist.
 */
export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputClass = 'h-14 rounded-full bg-white/10 border-white/20 text-white';
  const placeholderColor = 'rgba(255,255,255,0.5)';

  const canSubmit =
    phone && postcode && houseNumber && termsAccepted && privacyAccepted && !loading;

  const handleSubmit = async () => {
    if (!user) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const cleanPostcode = postcode.toUpperCase().replace(/\s/g, '');

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          phone_number: phone,
          postcode: cleanPostcode,
          house_number: houseNumber,
        },
      });
      if (updateError) throw updateError;

      await supabase.from('profiles').update({ phone }).eq('id', user.id);

      const now = new Date().toISOString();
      await supabase.from('user_consents').upsert({
        user_id: user.id,
        terms_accepted: true,
        terms_accepted_at: now,
        terms_version: '1.1',
        privacy_accepted: true,
        privacy_accepted_at: now,
        privacy_version: '1.1',
      });

      try {
        await supabase.functions.invoke('geocode-address', {
          body: { postcode: cleanPostcode, house_number: houseNumber },
        });
      } catch (e) {
        console.warn('Geocoding mislukt, useEnsureLocation probeert later opnieuw', e);
      }

      router.replace('/');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Opslaan mislukt. Probeer het opnieuw.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: '#18193f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 max-w-lg w-full mx-auto px-6 pt-16 pb-8">
          <Text className="text-3xl font-heading text-white mb-2">
            Bijna klaar!
          </Text>
          <Text className="text-white/70 mb-8">
            Vul je gegevens aan zodat we items binnen 7 km van jou kunnen tonen.
          </Text>

          <View className="gap-4">
            <Input
              placeholder="Telefoonnummer"
              placeholderTextColor={placeholderColor}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              className={inputClass}
            />
            <View className="flex-row gap-3">
              <Input
                placeholder="Postcode"
                placeholderTextColor={placeholderColor}
                value={postcode}
                onChangeText={setPostcode}
                autoCapitalize="characters"
                maxLength={7}
                className={`${inputClass} flex-1`}
              />
              <Input
                placeholder="Nr."
                placeholderTextColor={placeholderColor}
                value={houseNumber}
                onChangeText={setHouseNumber}
                className={`${inputClass} w-28`}
              />
            </View>
          </View>

          <View className="gap-3 mt-6">
            <View className="flex-row items-start gap-3">
              <Checkbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
              <Text className="text-sm text-white flex-1">
                Ik ga akkoord met de{' '}
                <Text className="text-primary font-semibold underline">
                  Algemene Voorwaarden
                </Text>
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Checkbox checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} />
              <Text className="text-sm text-white flex-1">
                Ik heb het{' '}
                <Text className="text-primary font-semibold underline">
                  Privacybeleid
                </Text>{' '}
                gelezen en ga hiermee akkoord
              </Text>
            </View>
          </View>

          {errorMsg && (
            <View className="mt-4 p-3 rounded-full bg-destructive/20 border border-destructive/60">
              <Text className="text-sm text-white">{errorMsg}</Text>
            </View>
          )}

          <Button
            onPress={handleSubmit}
            className="w-full mt-8 h-14 rounded-full"
            disabled={!canSubmit}>
            {loading ? (
              <Loader2 size={20} color="white" />
            ) : (
              <Text className="font-bold text-white">Aan de slag</Text>
            )}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

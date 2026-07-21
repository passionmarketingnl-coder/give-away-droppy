import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {
  ArrowRight,
  Check,
  Loader2,
  Mail,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase/client';

type Step = 'welcome' | 'login' | 'register' | 'verify' | 'forgot' | 'forgot-sent';

const logoBlue = require('../../assets/brand/logo-blue.png');

export default function AuthScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleLogin = async () => {
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErrorMsg(`Inloggen mislukt: ${error.message}`);
    }
    // Bij succes: AuthProvider's onAuthStateChange triggert → (tabs)/_layout redirect
  };

  const handleRegister = async () => {
    clearMessages();
    setLoading(true);
    const cleanPostcode = postcode.toUpperCase().replace(/\s/g, '');
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          postcode: cleanPostcode,
          house_number: houseNumber,
        },
      },
    });
    if (error) {
      setLoading(false);
      setErrorMsg(`Registratie mislukt: ${error.message}`);
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      const now = new Date().toISOString();
      await supabase.from('user_consents').insert({
        user_id: userId,
        terms_accepted: true,
        terms_accepted_at: now,
        terms_version: '1.1',
        privacy_accepted: true,
        privacy_accepted_at: now,
        privacy_version: '1.1',
      });
    }
    if (!data.session) {
      setLoading(false);
      setStep('verify');
      return;
    }
    try {
      await supabase.functions.invoke('geocode-address', {
        body: { postcode: cleanPostcode, house_number: houseNumber },
      });
    } catch (e) {
      console.warn('Geocoding failed, kan later opnieuw', e);
    }
    setLoading(false);
  };

  const showOAuthSoon = () => {
    clearMessages();
    setInfoMsg(
      'Google en Apple sign-in komen in een volgende update. Gebruik voor nu e-mail en wachtwoord.'
    );
  };

  const handleForgotPassword = async () => {
    clearMessages();
    if (!email) {
      setErrorMsg('Vul eerst je e-mailadres in.');
      return;
    }
    setLoading(true);
    // Op web: redirect naar reset-pagina in dezelfde app.
    // Op native: dezelfde URL, opent in browser tot deep linking is opgezet.
    const redirectTo =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : 'https://droppi.app/reset-password';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(`Verzenden mislukt: ${error.message}`);
      return;
    }
    setStep('forgot-sent');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 max-w-lg w-full mx-auto">
          {step === 'welcome' && (
            <View className="flex-1 items-center justify-center px-6 py-12">
              <Text className="font-poppins-600 text-sm text-muted-foreground text-center tracking-wider mb-6 uppercase">
                Don't use it? Share it.
              </Text>
              <Image
                source={logoBlue}
                className="w-4/5 max-w-sm mb-8"
                style={{ aspectRatio: 810 / 390 }}
                resizeMode="contain"
              />
              <Text className="text-base text-muted-foreground text-center mb-8 max-w-xs">
                De weggeefhoek voor jouw buurt. Geef gratis weg, eerlijk verloot,
                makkelijk opgehaald.
              </Text>
              <View className="gap-4 w-full max-w-xs items-start">
                {[
                  'Plaats iets gratis in je buurt',
                  'Buren doen mee met 1 tik',
                  'Automatisch eerlijk verloot',
                ].map((line) => (
                  <View key={line} className="flex-row items-center gap-3">
                    <View className="w-7 h-7 rounded-full bg-droppi-green items-center justify-center">
                      <Check size={16} color="hsl(238 45% 16%)" strokeWidth={3} />
                    </View>
                    <Text className="text-sm text-foreground">{line}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={() => setStep('login')}
                className="w-full max-w-xs mt-10 h-14 rounded-full overflow-hidden"
                style={Platform.select({
                  ios: {
                    shadowColor: '#6880FF',
                    shadowOpacity: 0.35,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                  },
                  android: { elevation: 8 },
                  web: { boxShadow: '0 8px 22px rgba(104,128,255,0.35)' } as any,
                })}>
                <LinearGradient
                  colors={['#6880FF', '#9FFA7F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}>
                  <Text className="font-poppins-700 text-base text-white">Aan de slag</Text>
                  <ArrowRight size={20} color="white" />
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {step === 'login' && (
            <View className="flex-1 px-6 pt-16">
              <Text className="text-3xl font-heading text-foreground mb-2">Inloggen</Text>
              <Text className="text-muted-foreground mb-8">
                Log in met je e-mail en wachtwoord.
              </Text>
              <View className="gap-4">
                <Input
                  placeholder="E-mailadres"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="h-14 rounded-xl"
                />
                <Input
                  placeholder="Wachtwoord"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  className="h-14 rounded-xl"
                />
              </View>
              {errorMsg && (
                <View className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive">
                  <Text className="text-sm text-destructive">{errorMsg}</Text>
                </View>
              )}
              {infoMsg && (
                <View className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary">
                  <Text className="text-sm text-foreground">{infoMsg}</Text>
                </View>
              )}
              <Button
                onPress={handleLogin}
                className="w-full mt-6 h-14 rounded-xl"
                disabled={!email || !password || loading}>
                {loading ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <Text className="font-bold">Inloggen</Text>
                )}
              </Button>
              <Pressable
                onPress={() => {
                  clearMessages();
                  setStep('forgot');
                }}
                className="mt-3">
                <Text className="text-sm text-muted-foreground text-center">
                  Wachtwoord vergeten?
                </Text>
              </Pressable>
              <Pressable onPress={() => setStep('register')} className="mt-4">
                <Text className="text-sm text-primary font-semibold text-center">
                  Nog geen account? Registreer je
                </Text>
              </Pressable>
              <View className="flex-row items-center gap-3 mt-6">
                <View className="flex-1 h-px bg-border" />
                <Text className="text-xs text-muted-foreground">of</Text>
                <View className="flex-1 h-px bg-border" />
              </View>
              <View className="flex-row gap-3 mt-4">
                <Button
                  variant="outline"
                  onPress={showOAuthSoon}
                  className="flex-1 h-14 rounded-xl">
                  <Text>Google</Text>
                </Button>
                <Button
                  variant="outline"
                  onPress={showOAuthSoon}
                  className="flex-1 h-14 rounded-xl">
                  <Text>Apple</Text>
                </Button>
              </View>
              <Text className="text-xs text-muted-foreground text-center mt-2">
                Google/Apple: binnenkort beschikbaar
              </Text>
            </View>
          )}

          {step === 'register' && (
            <View className="flex-1 px-6 pt-16 pb-8">
              <Text className="text-3xl font-heading text-foreground mb-2">
                Account aanmaken
              </Text>
              <Text className="text-muted-foreground mb-8">
                Vul je gegevens in om te starten.
              </Text>
              <View className="gap-4">
                <Input
                  placeholder="Voornaam"
                  value={firstName}
                  onChangeText={setFirstName}
                  className="h-14 rounded-xl"
                />
                <Input
                  placeholder="Achternaam"
                  value={lastName}
                  onChangeText={setLastName}
                  className="h-14 rounded-xl"
                />
                <Input
                  placeholder="Telefoonnummer"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  className="h-14 rounded-xl"
                />
                <View className="flex-row gap-3">
                  <Input
                    placeholder="Postcode"
                    value={postcode}
                    onChangeText={setPostcode}
                    autoCapitalize="characters"
                    maxLength={7}
                    className="flex-1 h-14 rounded-xl"
                  />
                  <Input
                    placeholder="Nr."
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                    className="w-28 h-14 rounded-xl"
                  />
                </View>
                <Input
                  placeholder="E-mailadres"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="h-14 rounded-xl"
                />
                <Input
                  placeholder="Wachtwoord (min. 6 tekens)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  className="h-14 rounded-xl"
                />
              </View>
              <View className="gap-3 mt-4">
                <View className="flex-row items-start gap-3">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                  />
                  <Text className="text-sm text-foreground flex-1">
                    Ik ga akkoord met de{' '}
                    <Text className="text-primary font-semibold underline">
                      Algemene Voorwaarden
                    </Text>
                  </Text>
                </View>
                <View className="flex-row items-start gap-3">
                  <Checkbox
                    checked={privacyAccepted}
                    onCheckedChange={setPrivacyAccepted}
                  />
                  <Text className="text-sm text-foreground flex-1">
                    Ik heb het{' '}
                    <Text className="text-primary font-semibold underline">
                      Privacybeleid
                    </Text>{' '}
                    gelezen en ga hiermee akkoord
                  </Text>
                </View>
              </View>
              {errorMsg && (
                <View className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive">
                  <Text className="text-sm text-destructive">{errorMsg}</Text>
                </View>
              )}
              <Button
                onPress={handleRegister}
                className="w-full mt-6 h-14 rounded-xl"
                disabled={
                  !email ||
                  !password ||
                  !firstName ||
                  !lastName ||
                  !phone ||
                  !postcode ||
                  !houseNumber ||
                  !termsAccepted ||
                  !privacyAccepted ||
                  loading
                }>
                {loading ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <Text className="font-bold">Registreren</Text>
                )}
              </Button>
              <Pressable onPress={() => setStep('login')} className="mt-4">
                <Text className="text-sm text-primary font-semibold text-center">
                  Al een account? Log in
                </Text>
              </Pressable>
            </View>
          )}

          {step === 'verify' && (
            <View className="flex-1 items-center justify-center px-6 py-12">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-6">
                <Mail size={32} color="hsl(207 90% 54%)" />
              </View>
              <Text className="text-3xl font-heading text-foreground mb-3">
                Bevestig je e-mail
              </Text>
              <Text className="text-muted-foreground mb-2 max-w-xs text-center">
                We hebben een bevestigingslink gestuurd naar:
              </Text>
              <Text className="font-bold text-foreground mb-6">{email}</Text>
              <Text className="text-sm text-muted-foreground max-w-xs text-center">
                Klik op de link in de e-mail om je account te activeren. Daarna kun je
                inloggen.
              </Text>
              <Button
                onPress={() => setStep('login')}
                variant="outline"
                className="mt-8 h-12 rounded-xl px-8">
                <Text>Ga naar inloggen</Text>
              </Button>
            </View>
          )}

          {step === 'forgot' && (
            <View className="flex-1 px-6 pt-16">
              <Text className="text-3xl font-heading text-foreground mb-2">
                Wachtwoord vergeten
              </Text>
              <Text className="text-muted-foreground mb-8">
                Vul je e-mailadres in, we sturen je een link om een nieuw wachtwoord
                in te stellen.
              </Text>
              <Input
                placeholder="E-mailadres"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="h-14 rounded-xl"
              />
              {errorMsg && (
                <View className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive">
                  <Text className="text-sm text-destructive">{errorMsg}</Text>
                </View>
              )}
              <Button
                onPress={handleForgotPassword}
                className="w-full mt-6 h-14 rounded-xl"
                disabled={!email || loading}>
                {loading ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <Text className="font-bold">Stuur reset-link</Text>
                )}
              </Button>
              <Pressable
                onPress={() => {
                  clearMessages();
                  setStep('login');
                }}
                className="mt-4">
                <Text className="text-sm text-primary font-semibold text-center">
                  Terug naar inloggen
                </Text>
              </Pressable>
            </View>
          )}

          {step === 'forgot-sent' && (
            <View className="flex-1 items-center justify-center px-6 py-12">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-6">
                <Mail size={32} color="hsl(207 90% 54%)" />
              </View>
              <Text className="text-3xl font-heading text-foreground mb-3">
                Check je e-mail
              </Text>
              <Text className="text-muted-foreground mb-2 max-w-xs text-center">
                We hebben een reset-link gestuurd naar:
              </Text>
              <Text className="font-bold text-foreground mb-6">{email}</Text>
              <Text className="text-sm text-muted-foreground max-w-xs text-center">
                Klik op de link in de e-mail om een nieuw wachtwoord in te stellen.
                Zie je geen mail? Check je spam.
              </Text>
              <Button
                onPress={() => setStep('login')}
                variant="outline"
                className="mt-8 h-12 rounded-xl px-8">
                <Text>Terug naar inloggen</Text>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

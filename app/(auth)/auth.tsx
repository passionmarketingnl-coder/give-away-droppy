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
  ArrowLeft,
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
import { signInWithApple, signInWithGoogle } from '@/lib/auth/oauth';
import { supabase } from '@/lib/supabase/client';

type Step = 'welcome' | 'login' | 'register' | 'verify' | 'forgot' | 'forgot-sent';

// Welcome-scherm op donkere navy achtergrond: witte wordmark zonder tagline
// (de tagline "Don't use it? Share it." staat al bovenaan als kop).
const logoWhite = require('../../assets/brand/logo-white-v2.png');

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
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
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

  const handleOAuth = async (provider: 'google' | 'apple') => {
    clearMessages();
    setOauthLoading(provider);
    const result =
      provider === 'google' ? await signInWithGoogle() : await signInWithApple();
    setOauthLoading(null);
    if (!result.ok && !result.cancelled) {
      setErrorMsg(result.error || 'Inloggen mislukt. Probeer het opnieuw.');
    }
    // Bij succes triggert onAuthStateChange de redirect; OAuth-gebruikers
    // zonder postcode/consent worden door (tabs)/_layout naar
    // /complete-profile gestuurd.
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

  // Hele auth-flow op donkere navy: onboarding + login/register/verify/forgot.
  const inputClass = 'h-14 rounded-full bg-white/10 border-white/20 text-white';
  const placeholderColor = 'rgba(255,255,255,0.5)';

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: '#18193f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 max-w-lg w-full mx-auto">
          {step === 'welcome' && (
            <View className="flex-1 items-center justify-center px-6 py-10">
              <Image
                source={logoWhite}
                style={{ width: 240, height: 240 }}
                className="mb-6"
                resizeMode="contain"
              />
              <Text className="text-base text-white/80 text-center mb-8 max-w-xs">
                De weggeefhoek voor jouw buurt. Geef gratis weg, eerlijk verloot,
                makkelijk opgehaald.
              </Text>
              <View className="gap-3 w-full max-w-xs">
                {[
                  {
                    line: 'Plaats iets gratis in je buurt',
                    gradient: ['rgba(104,128,255,0.28)', 'rgba(104,128,255,0.04)'],
                  },
                  {
                    line: 'Buren doen mee met 1 tik',
                    gradient: ['rgba(246,95,231,0.28)', 'rgba(246,95,231,0.04)'],
                  },
                  {
                    line: 'Automatisch eerlijk verloot',
                    gradient: ['rgba(104,128,255,0.28)', 'rgba(246,95,231,0.28)'],
                  },
                ].map(({ line, gradient }) => (
                  <View
                    key={line}
                    className="w-full h-14 rounded-full overflow-hidden border border-white/10">
                    <LinearGradient
                      colors={gradient as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        gap: 12,
                      }}>
                      <View className="w-8 h-8 rounded-full bg-white/15 items-center justify-center">
                        <Check size={16} color="white" strokeWidth={3} />
                      </View>
                      <Text className="text-sm text-white font-poppins-500 flex-1">
                        {line}
                      </Text>
                    </LinearGradient>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={() => setStep('login')}
                className="w-full max-w-xs mt-10 h-14 rounded-full overflow-hidden"
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
              <Pressable
                onPress={() => {
                  clearMessages();
                  setStep('welcome');
                }}
                className="w-10 h-10 rounded-full items-center justify-center bg-white/10 mb-6">
                <ArrowLeft size={20} color="white" />
              </Pressable>
              <Text className="text-3xl font-heading text-white mb-2">Inloggen</Text>
              <Text className="text-white/70 mb-8">
                Log in met je e-mail en wachtwoord.
              </Text>
              <View className="gap-4">
                <Input
                  placeholder="E-mailadres"
                  placeholderTextColor={placeholderColor}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className={inputClass}
                />
                <Input
                  placeholder="Wachtwoord"
                  placeholderTextColor={placeholderColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  className={inputClass}
                />
              </View>
              {errorMsg && (
                <View className="mt-4 p-3 rounded-full bg-destructive/20 border border-destructive/60">
                  <Text className="text-sm text-white">{errorMsg}</Text>
                </View>
              )}
              {infoMsg && (
                <View className="mt-4 p-3 rounded-full bg-white/10 border border-white/20">
                  <Text className="text-sm text-white">{infoMsg}</Text>
                </View>
              )}
              <Button
                onPress={handleLogin}
                className="w-full mt-6 h-14 rounded-full"
                disabled={!email || !password || loading}>
                {loading ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <Text className="font-bold text-white">Inloggen</Text>
                )}
              </Button>
              <Pressable
                onPress={() => {
                  clearMessages();
                  setStep('forgot');
                }}
                className="mt-3">
                <Text className="text-sm text-white/60 text-center">
                  Wachtwoord vergeten?
                </Text>
              </Pressable>
              <Pressable onPress={() => setStep('register')} className="mt-4">
                <Text className="text-sm text-primary font-semibold text-center">
                  Nog geen account? Registreer je
                </Text>
              </Pressable>
              <View className="flex-row items-center gap-3 mt-6">
                <View className="flex-1 h-px bg-white/20" />
                <Text className="text-xs text-white/60">of</Text>
                <View className="flex-1 h-px bg-white/20" />
              </View>
              <View className="flex-row gap-3 mt-4">
                <Button
                  variant="outline"
                  onPress={() => handleOAuth('google')}
                  disabled={oauthLoading !== null}
                  className="flex-1 h-14 rounded-full bg-white/10 border-white/20">
                  {oauthLoading === 'google' ? (
                    <Loader2 size={18} color="white" />
                  ) : (
                    <Text className="text-white">Google</Text>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onPress={() => handleOAuth('apple')}
                  disabled={oauthLoading !== null}
                  className="flex-1 h-14 rounded-full bg-white/10 border-white/20">
                  {oauthLoading === 'apple' ? (
                    <Loader2 size={18} color="white" />
                  ) : (
                    <Text className="text-white">Apple</Text>
                  )}
                </Button>
              </View>
            </View>
          )}

          {step === 'register' && (
            <View className="flex-1 px-6 pt-16 pb-8">
              <Pressable
                onPress={() => {
                  clearMessages();
                  setStep('welcome');
                }}
                className="w-10 h-10 rounded-full items-center justify-center bg-white/10 mb-6">
                <ArrowLeft size={20} color="white" />
              </Pressable>
              <Text className="text-3xl font-heading text-white mb-2">
                Account aanmaken
              </Text>
              <Text className="text-white/70 mb-8">
                Vul je gegevens in om te starten.
              </Text>
              <View className="gap-4">
                <Input
                  placeholder="Voornaam"
                  placeholderTextColor={placeholderColor}
                  value={firstName}
                  onChangeText={setFirstName}
                  className={inputClass}
                />
                <Input
                  placeholder="Achternaam"
                  placeholderTextColor={placeholderColor}
                  value={lastName}
                  onChangeText={setLastName}
                  className={inputClass}
                />
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
                <Input
                  placeholder="E-mailadres"
                  placeholderTextColor={placeholderColor}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className={inputClass}
                />
                <Input
                  placeholder="Wachtwoord (min. 6 tekens)"
                  placeholderTextColor={placeholderColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  className={inputClass}
                />
              </View>
              <View className="gap-3 mt-4">
                <View className="flex-row items-start gap-3">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                  />
                  <Text className="text-sm text-white flex-1">
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
                onPress={handleRegister}
                className="w-full mt-6 h-14 rounded-full"
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
                  <Text className="font-bold text-white">Registreren</Text>
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
              <View className="w-16 h-16 rounded-full overflow-hidden mb-6">
                <LinearGradient
                  colors={['rgba(104,128,255,0.45)', 'rgba(246,95,231,0.45)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={32} color="white" />
                </LinearGradient>
              </View>
              <Text className="text-3xl font-heading text-white mb-3">
                Bevestig je e-mail
              </Text>
              <Text className="text-white/70 mb-2 max-w-xs text-center">
                We hebben een bevestigingslink gestuurd naar:
              </Text>
              <Text className="font-bold text-white mb-6">{email}</Text>
              <Text className="text-sm text-white/70 max-w-xs text-center">
                Klik op de link in de e-mail om je account te activeren. Daarna kun je
                inloggen.
              </Text>
              <Button
                onPress={() => setStep('login')}
                variant="outline"
                className="mt-8 h-12 rounded-full px-8 bg-white/10 border-white/20">
                <Text className="text-white">Ga naar inloggen</Text>
              </Button>
            </View>
          )}

          {step === 'forgot' && (
            <View className="flex-1 px-6 pt-16">
              <Pressable
                onPress={() => {
                  clearMessages();
                  setStep('login');
                }}
                className="w-10 h-10 rounded-full items-center justify-center bg-white/10 mb-6">
                <ArrowLeft size={20} color="white" />
              </Pressable>
              <Text className="text-3xl font-heading text-white mb-2">
                Wachtwoord vergeten
              </Text>
              <Text className="text-white/70 mb-8">
                Vul je e-mailadres in, we sturen je een link om een nieuw wachtwoord
                in te stellen.
              </Text>
              <Input
                placeholder="E-mailadres"
                placeholderTextColor={placeholderColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className={inputClass}
              />
              {errorMsg && (
                <View className="mt-4 p-3 rounded-full bg-destructive/20 border border-destructive/60">
                  <Text className="text-sm text-white">{errorMsg}</Text>
                </View>
              )}
              <Button
                onPress={handleForgotPassword}
                className="w-full mt-6 h-14 rounded-full"
                disabled={!email || loading}>
                {loading ? (
                  <Loader2 size={20} color="white" />
                ) : (
                  <Text className="font-bold text-white">Stuur reset-link</Text>
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
              <View className="w-16 h-16 rounded-full overflow-hidden mb-6">
                <LinearGradient
                  colors={['rgba(104,128,255,0.45)', 'rgba(246,95,231,0.45)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={32} color="white" />
                </LinearGradient>
              </View>
              <Text className="text-3xl font-heading text-white mb-3">
                Check je e-mail
              </Text>
              <Text className="text-white/70 mb-2 max-w-xs text-center">
                We hebben een reset-link gestuurd naar:
              </Text>
              <Text className="font-bold text-white mb-6">{email}</Text>
              <Text className="text-sm text-white/70 max-w-xs text-center">
                Klik op de link in de e-mail om een nieuw wachtwoord in te stellen.
                Zie je geen mail? Check je spam.
              </Text>
              <Button
                onPress={() => setStep('login')}
                variant="outline"
                className="mt-8 h-12 rounded-full px-8 bg-white/10 border-white/20">
                <Text className="text-white">Terug naar inloggen</Text>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

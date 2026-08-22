import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase/client';

// Sluit op web een eventueel openstaande auth-popup netjes af.
WebBrowser.maybeCompleteAuthSession();

export type OAuthOutcome =
  | { ok: true }
  | { ok: false; cancelled?: boolean; error?: string };

// Native: droppi:// (app-scheme uit app.json), web: huidige origin.
// Geen custom domein nodig; wel moeten deze URLs in de Supabase
// Auth redirect allow-list staan.
const redirectTo = makeRedirectUri();

/**
 * Zet de callback-URL van de OAuth-flow om in een Supabase-sessie.
 * Ondersteunt zowel de implicit flow (tokens in #fragment) als PKCE
 * (?code=) zodat een latere flowType-wijziging niet stilletjes breekt.
 */
async function createSessionFromUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  const code = parsed.searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const access_token = hashParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token');
  if (!access_token || !refresh_token) {
    const description = hashParams.get('error_description');
    throw new Error(description || 'Inloggen mislukt: geen sessie ontvangen.');
  }
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
}

/** Browser-gebaseerde OAuth-flow (Google overal, Apple op web/Android). */
async function browserOAuth(provider: 'google' | 'apple'): Promise<OAuthOutcome> {
  if (Platform.OS === 'web') {
    // Volledige redirect; detectSessionInUrl pakt de sessie op na terugkeer.
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message || 'Kon inlogpagina niet openen.' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    return { ok: false, cancelled: true };
  }
  try {
    await createSessionFromUrl(result.url);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Inloggen mislukt.' };
  }
}

export async function signInWithGoogle(): Promise<OAuthOutcome> {
  return browserOAuth('google');
}

export async function signInWithApple(): Promise<OAuthOutcome> {
  // iOS: native Sign in with Apple (vereist door Apple, en betere UX).
  if (Platform.OS === 'ios') {
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        return { ok: false, error: 'Geen identiteitsbewijs van Apple ontvangen.' };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });
      if (error) return { ok: false, error: error.message };

      // Apple geeft de naam alléén bij de allereerste login door; direct
      // vastleggen in user metadata zodat het profiel een naam heeft.
      const first = credential.fullName?.givenName;
      const last = credential.fullName?.familyName;
      if (first || last) {
        await supabase.auth.updateUser({
          data: { first_name: first || '', last_name: last || '' },
        });
        await supabase
          .from('profiles')
          .update({ first_name: first || '', last_name: last || '' })
          .eq('id', (await supabase.auth.getUser()).data.user?.id || '');
      }
      return { ok: true };
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') {
        return { ok: false, cancelled: true };
      }
      return { ok: false, error: e?.message || 'Inloggen met Apple mislukt.' };
    }
  }

  // Web en Android: browser-flow via Supabase.
  return browserOAuth('apple');
}

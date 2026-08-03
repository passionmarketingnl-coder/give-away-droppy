import { Platform, Share } from 'react-native';

export type ShareResult = 'shared' | 'copied' | 'failed';

/**
 * P3 share: deel een post via de native share sheet (iOS/Android) of de
 * Web Share API. Desktop-browsers zonder navigator.share krijgen de
 * briefing-fallback: link naar het klembord ('copied' → toon zelf een
 * "Link gekopieerd!" melding).
 *
 * Op web gebruiken we window.location.origin zolang droppi.app nog niet
 * geregistreerd is; native houdt de droppi.app URL als placeholder tot
 * deep linking is opgezet.
 */
export async function sharePost(post: { id: string; title: string }): Promise<ShareResult> {
  const url =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/post/${post.id}`
      : `https://droppi.app/post/${post.id}`;
  const message = `Bekijk "${post.title}" op Droppi!`;

  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav && 'share' in nav && typeof nav.share === 'function') {
      try {
        await nav.share({ title: post.title, text: message, url });
        return 'shared';
      } catch {
        // Gebruiker annuleerde de share sheet: geen fallback nodig.
        return 'failed';
      }
    }
    if (nav?.clipboard) {
      try {
        await nav.clipboard.writeText(url);
        return 'copied';
      } catch {
        return 'failed';
      }
    }
    return 'failed';
  }

  try {
    // iOS toont url als aparte bijlage; Android negeert het url-veld,
    // dus daar plakken we de link in het bericht zelf.
    await Share.share(
      Platform.OS === 'ios'
        ? { title: post.title, message, url }
        : { title: post.title, message: `${message} ${url}` }
    );
    return 'shared';
  } catch {
    return 'failed';
  }
}

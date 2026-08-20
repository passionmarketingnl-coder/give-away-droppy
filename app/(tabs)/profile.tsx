import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Edit3,
  FileText,
  Heart,
  Loader2,
  LogOut,
  Package,
  Shield,
  Trash2,
  Trophy,
} from 'lucide-react-native';

import PrivacySheet from '@/components/legal/PrivacySheet';
import TermsSheet from '@/components/legal/TermsSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLikedPosts, useMyPosts, useWonPosts } from '@/lib/hooks/useProfile';
import { supabase } from '@/lib/supabase/client';

const statusLabels: Record<string, string> = {
  active: 'Actief',
  ending: 'Bijna afgelopen',
  raffled: 'Verloot',
  picked_up: 'Opgehaald',
  removed: 'Verwijderd',
  reroll: 'Herverloting',
};

type Tab = 'given' | 'won' | 'liked';

// Tint per profile-tab: given=blauw (jouw acties), won=groen (succes),
// liked=roze (favorieten). Matcht met glassmorphism-patroon elders.
const tabTintMap: Record<Tab, { gradient: [string, string]; border: string }> = {
  given: {
    gradient: ['rgba(104,128,255,0.14)', 'rgba(104,128,255,0.02)'],
    border: 'rgba(104,128,255,0.2)',
  },
  won: {
    gradient: ['rgba(159,250,127,0.2)', 'rgba(159,250,127,0.04)'],
    border: 'rgba(63,159,82,0.24)',
  },
  liked: {
    gradient: ['rgba(246,95,231,0.14)', 'rgba(246,95,231,0.02)'],
    border: 'rgba(246,95,231,0.22)',
  },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: myPosts, isLoading: postsLoading } = useMyPosts();
  const { data: wonPosts, isLoading: wonLoading } = useWonPosts();
  const { data: likedPosts, isLoading: likedLoading } = useLikedPosts();
  const [tab, setTab] = useState<Tab>('given');
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Store-vereiste (Apple 5.1.1(v) / Google account deletion policy):
  // in-app accountverwijdering. Edge function wist storage + alle data.
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error || data?.error) {
        throw new Error(data?.error || 'Verwijderen mislukt');
      }
      // Sessie is ongeldig na verwijdering; signOut ruimt lokale state op.
      await signOut();
    } catch {
      setDeleting(false);
    }
  };

  const firstName = (user?.user_metadata as any)?.first_name || '';
  const lastName = (user?.user_metadata as any)?.last_name || '';
  const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
  const displayName = firstName ? `${firstName} ${lastName}`.trim() : user?.email || 'Gebruiker';
  const initials = firstName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`
    : '?';

  const activePosts = tab === 'given' ? myPosts : tab === 'won' ? wonPosts : likedPosts;
  const loading = tab === 'given' ? postsLoading : tab === 'won' ? wonLoading : likedLoading;

  const tabs: { key: Tab; label: string; Icon: typeof Package }[] = [
    { key: 'given', label: 'Mijn items', Icon: Package },
    { key: 'won', label: 'Gewonnen', Icon: Trophy },
    { key: 'liked', label: 'Geliked', Icon: Heart },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Brand header full-width met avatar + naam prominent */}
      <View style={{ backgroundColor: "#18193f" }} className="pt-4 pb-8">
        <View className="max-w-lg mx-auto w-full px-4">
          <Text className="text-3xl font-heading text-white mb-6">Profiel</Text>

          <View className="flex-row items-center gap-4">
            {/* Gradient ring rond avatar (logo blauw→roze) */}
            <LinearGradient
              colors={['#6880FF', '#F65FE7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 84, height: 84, borderRadius: 42, padding: 3 }}>
              <View
                className="flex-1 rounded-full items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                ) : (
                  <Text className="text-white font-heading text-3xl">{initials}</Text>
                )}
              </View>
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-xl font-poppins-700 text-white" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="text-sm text-white/70" numberOfLines={1}>
                {user?.email}
              </Text>
              <View className="flex-row gap-4 mt-1.5">
                <Text className="text-xs text-white/80">
                  <Text className="text-white font-poppins-700">{myPosts?.length || 0}</Text>{' '}
                  weggegeven
                </Text>
                <Text className="text-xs text-white/80">
                  <Text className="text-white font-poppins-700">{wonPosts?.length || 0}</Text>{' '}
                  gewonnen
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="max-w-lg mx-auto w-full">
          <View className="flex-row px-4 gap-2 mt-4 mb-4">
            {tabs.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  className={`flex-1 py-2.5 rounded-full flex-row items-center justify-center gap-1.5 ${
                    active ? 'bg-primary' : 'bg-card border border-border'
                  }`}>
                  <Icon
                    size={16}
                    color={active ? 'white' : 'hsl(238 45% 16%)'}
                  />
                  <Text
                    className={`text-sm font-poppins-600 ${
                      active ? 'text-white' : 'text-foreground'
                    }`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="px-4 gap-3 pb-4">
            {loading && (
              <View className="items-center py-8">
                <Loader2 size={24} color="hsl(231 100% 71%)" />
              </View>
            )}
            {!loading && (!activePosts || activePosts.length === 0) && (
              <View className="items-center py-8">
                <Text className="text-muted-foreground text-sm">
                  {tab === 'given'
                    ? 'Je hebt nog niets weggegeven.'
                    : tab === 'won'
                      ? 'Je hebt nog niets gewonnen.'
                      : 'Je hebt nog niets geliked.'}
                </Text>
              </View>
            )}
            {(activePosts || []).map((post: any) => {
              const tint = tabTintMap[tab];
              return (
                <Pressable
                  key={post.id}
                  onPress={() => router.push(`/post/${post.id}`)}
                  style={{
                    borderWidth: 1,
                    borderColor: tint.border,
                    borderRadius: 20,
                    overflow: 'hidden',
                  }}>
                  <LinearGradient
                    colors={tint.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                    }}>
                    <View className="w-14 h-14 rounded-xl overflow-hidden bg-muted">
                      {post.images?.[0] ? (
                        <Image source={{ uri: post.images[0].image_url }} className="w-full h-full" />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <Text className="text-muted-foreground text-xs">Geen foto</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-poppins-700 text-foreground text-sm" numberOfLines={1}>
                        {post.title}
                      </Text>
                      <Text
                        className={`text-xs font-poppins-600 ${
                          post.status === 'active' || post.status === 'ending'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}>
                        {statusLabels[post.status] || post.status}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="hsl(232 15% 55%)" />
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>

          <View className="px-4 gap-2 pb-8">
            {[
              {
                key: 'edit',
                label: 'Profiel bewerken',
                Icon: Edit3,
                iconColor: '#6880FF',
                gradient: ['rgba(104,128,255,0.12)', 'rgba(104,128,255,0.02)'] as [string, string],
                border: 'rgba(104,128,255,0.2)',
                onPress: () => router.push('/profile/edit'),
                chevron: true,
              },
              {
                key: 'signout',
                label: 'Uitloggen',
                Icon: LogOut,
                iconColor: '#D93838',
                gradient: ['rgba(228,72,72,0.1)', 'rgba(228,72,72,0.02)'] as [string, string],
                border: 'rgba(228,72,72,0.18)',
                onPress: () => signOut(),
                chevron: false,
              },
              {
                key: 'terms',
                label: 'Algemene Voorwaarden',
                Icon: FileText,
                iconColor: '#5A5D78',
                gradient: ['rgba(90,93,120,0.08)', 'rgba(90,93,120,0.02)'] as [string, string],
                border: 'rgba(90,93,120,0.16)',
                onPress: () => setTermsOpen(true),
                chevron: true,
              },
              {
                key: 'privacy',
                label: 'Privacybeleid',
                Icon: Shield,
                iconColor: '#5A5D78',
                gradient: ['rgba(90,93,120,0.08)', 'rgba(90,93,120,0.02)'] as [string, string],
                border: 'rgba(90,93,120,0.16)',
                onPress: () => setPrivacyOpen(true),
                chevron: true,
              },
            ].map(({ key, label, Icon, iconColor, gradient, border, onPress, chevron }) => (
              <Pressable
                key={key}
                onPress={onPress}
                style={{
                  borderWidth: 1,
                  borderColor: border,
                  borderRadius: 20,
                  overflow: 'hidden',
                }}>
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}>
                  <Icon size={20} color={iconColor} />
                  <Text className="flex-1 font-poppins-600 text-foreground">{label}</Text>
                  {chevron && <ChevronRight size={20} color="hsl(232 15% 55%)" />}
                </LinearGradient>
              </Pressable>
            ))}

            {/* Account verwijderen — verplicht in-app aanwezig voor App Store
                (5.1.1(v)) en Google Play (account deletion policy). */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Pressable
                  disabled={deleting}
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(228,72,72,0.3)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    opacity: deleting ? 0.6 : 1,
                  }}>
                  <LinearGradient
                    colors={['rgba(228,72,72,0.16)', 'rgba(228,72,72,0.04)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}>
                    {deleting ? (
                      <Loader2 size={20} color="#D93838" />
                    ) : (
                      <Trash2 size={20} color="#D93838" />
                    )}
                    <Text className="flex-1 font-poppins-600 text-destructive">
                      Account verwijderen
                    </Text>
                  </LinearGradient>
                </Pressable>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    <Text>Account permanent verwijderen?</Text>
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <Text>
                      Dit verwijdert je account, al je posts, foto&apos;s, chats,
                      deelnames en meldingen definitief. Dit kan niet ongedaan
                      worden gemaakt.
                    </Text>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    <Text>Annuleren</Text>
                  </AlertDialogCancel>
                  <AlertDialogAction onPress={handleDeleteAccount}>
                    <Text>Definitief verwijderen</Text>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </View>
        </View>
      </ScrollView>

      <TermsSheet open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacySheet open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </View>
  );
}

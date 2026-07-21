import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Edit3,
  FileText,
  Heart,
  Loader2,
  LogOut,
  Package,
  Shield,
  Trophy,
} from 'lucide-react-native';

import PrivacySheet from '@/components/legal/PrivacySheet';
import TermsSheet from '@/components/legal/TermsSheet';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLikedPosts, useMyPosts, useWonPosts } from '@/lib/hooks/useProfile';

const statusLabels: Record<string, string> = {
  active: 'Actief',
  ending: 'Bijna afgelopen',
  raffled: 'Verloot',
  picked_up: 'Opgehaald',
  removed: 'Verwijderd',
  reroll: 'Herverloting',
};

type Tab = 'given' | 'won' | 'liked';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: myPosts, isLoading: postsLoading } = useMyPosts();
  const { data: wonPosts, isLoading: wonLoading } = useWonPosts();
  const { data: likedPosts, isLoading: likedLoading } = useLikedPosts();
  const [tab, setTab] = useState<Tab>('given');
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

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
    <ScrollView className="flex-1 bg-background">
      <View className="max-w-lg mx-auto w-full">
        <View className="px-4 pt-6 pb-4">
          <Text className="text-3xl font-heading text-foreground mb-6">Profiel</Text>

          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full" />
              ) : (
                <Text className="text-primary font-extrabold text-3xl">{initials}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-extrabold text-foreground" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                {user?.email}
              </Text>
              <View className="flex-row gap-4 mt-1">
                <Text className="text-xs text-muted-foreground">
                  <Text className="text-foreground font-bold">{myPosts?.length || 0}</Text>{' '}
                  weggegeven
                </Text>
                <Text className="text-xs text-muted-foreground">
                  <Text className="text-foreground font-bold">{wonPosts?.length || 0}</Text>{' '}
                  gewonnen
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 gap-2 mb-4">
          {tabs.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
                  active ? 'bg-primary' : 'bg-card border border-border'
                }`}>
                <Icon
                  size={16}
                  color={active ? 'white' : 'hsl(213 79% 13%)'}
                />
                <Text
                  className={`text-sm font-bold ${
                    active ? 'text-primary-foreground' : 'text-foreground'
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
              <Loader2 size={24} color="hsl(207 90% 54%)" />
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
          {(activePosts || []).map((post: any) => (
            <Pressable
              key={post.id}
              onPress={() => router.push(`/post/${post.id}`)}
              className="flex-row items-center gap-3 px-3 py-3 bg-card rounded-xl">
              <View className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
                {post.images?.[0] ? (
                  <Image source={{ uri: post.images[0].image_url }} className="w-full h-full" />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Text className="text-muted-foreground text-xs">Geen foto</Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
                  {post.title}
                </Text>
                <Text
                  className={`text-xs font-semibold ${
                    post.status === 'active' || post.status === 'ending'
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}>
                  {statusLabels[post.status] || post.status}
                </Text>
              </View>
              <ChevronRight size={20} color="hsl(213 20% 46%)" />
            </Pressable>
          ))}
        </View>

        <View className="px-4 gap-2 pb-8">
          <Pressable
            onPress={() => router.push('/profile/edit')}
            className="flex-row items-center gap-3 px-4 py-4 bg-card rounded-xl">
            <Edit3 size={20} color="hsl(213 20% 46%)" />
            <Text className="flex-1 font-semibold text-foreground">Profiel bewerken</Text>
            <ChevronRight size={20} color="hsl(213 20% 46%)" />
          </Pressable>
          <Pressable
            onPress={() => signOut()}
            className="flex-row items-center gap-3 px-4 py-4 bg-card rounded-xl">
            <LogOut size={20} color="hsl(213 20% 46%)" />
            <Text className="flex-1 font-semibold text-foreground">Uitloggen</Text>
          </Pressable>
          <Pressable
            onPress={() => setTermsOpen(true)}
            className="flex-row items-center gap-3 px-4 py-4 bg-card rounded-xl">
            <FileText size={20} color="hsl(213 20% 46%)" />
            <Text className="flex-1 font-semibold text-foreground">Algemene Voorwaarden</Text>
            <ChevronRight size={20} color="hsl(213 20% 46%)" />
          </Pressable>
          <Pressable
            onPress={() => setPrivacyOpen(true)}
            className="flex-row items-center gap-3 px-4 py-4 bg-card rounded-xl">
            <Shield size={20} color="hsl(213 20% 46%)" />
            <Text className="flex-1 font-semibold text-foreground">Privacybeleid</Text>
            <ChevronRight size={20} color="hsl(213 20% 46%)" />
          </Pressable>
        </View>
      </View>

      <TermsSheet open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacySheet open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </ScrollView>
  );
}

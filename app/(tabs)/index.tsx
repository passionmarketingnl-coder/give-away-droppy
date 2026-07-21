import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowUpDown, Bell, Clock, Heart, Search, SlidersHorizontal } from 'lucide-react-native';

import PostCard, { type PostCardData } from '@/components/feed/PostCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { usePosts } from '@/lib/hooks/usePosts';
import { useUnreadNotificationCount } from '@/lib/hooks/useProfile';

const logoWhite = require('../../assets/brand/logo-white.png');

const categories = [
  'Alles',
  'Meubels',
  'Kinderen',
  'Keuken',
  'Elektronica',
  'Boeken',
  'Tuin',
  'Sport',
  'Kleding',
  'Overig',
];

type SortBy = 'newest' | 'ending' | 'popular';

export default function FeedScreen() {
  const router = useRouter();
  const { data: posts, isLoading } = usePosts();
  const { data: unreadCount } = useUnreadNotificationCount();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('Alles');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['posts'] });
    setRefreshing(false);
  }, [queryClient]);

  const getTimeLeft = (raffleAt: string | null) => {
    if (!raffleAt) return '';
    const diff = new Date(raffleAt).getTime() - Date.now();
    if (diff <= 0) return 'Verlopen';
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours}u over`;
    return `${Math.floor(diff / 60000)}m over`;
  };

  const feedItems: PostCardData[] = (posts || []).map((post) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    category: post.category,
    imageUrl: post.images[0]?.image_url || '',
    images: post.images.map((img) => img.id),
    likeCount: post.like_count,
    userHasLiked: post.user_has_liked,
    status: post.status as any,
    distance: post.distance_km != null ? `${post.distance_km} km` : '',
    timeLeft: getTimeLeft(post.raffle_due_at),
    posterName: post.poster
      ? `${post.poster.first_name} ${post.poster.last_name.charAt(0)}.`
      : 'Onbekend',
    posterAvatar: post.poster?.avatar_url || '',
    createdAt: post.created_at,
    displayLocation: post.display_location
      ? post.display_location.split(',').pop()?.trim() || ''
      : '',
  }));

  const filtered = feedItems
    .filter((p) => {
      if (selectedCategory !== 'Alles' && p.category !== selectedCategory) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.likeCount - a.likeCount;
      if (sortBy === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  return (
    <View className="flex-1 bg-background">
      <View className="max-w-lg mx-auto w-full flex-1">
        {/* Brand app-header (Huisstijl 2.0) */}
        <View className="bg-primary px-4 pt-4 pb-5">
          <View className="flex-row items-center justify-between mb-4" style={{ height: 40 }}>
            <Image
              source={logoWhite}
              style={{ width: 128, height: 32 }}
              resizeMode="contain"
            />
            <Pressable
              onPress={() => router.push('/notifications')}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center relative">
              <Bell size={18} color="#ffffff" />
              {unreadCount && unreadCount > 0 ? (
                <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-droppi-pink items-center justify-center px-1">
                  <Text className="text-[10px] font-poppins-700 text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 relative">
              <View className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
                <Search size={18} color="#ffffff" />
              </View>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Zoek in jouw buurt..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                className="w-full h-11 pl-10 pr-4 rounded-full bg-white/20 text-sm text-white font-sans"
                style={Platform.select({
                  web: { outline: 'none' } as any,
                })}
              />
            </View>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Pressable className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
                  <SlidersHorizontal size={18} color="#ffffff" />
                </Pressable>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <Text>Sorteren op</Text>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onPress={() => setSortBy('newest')}>
                  <Clock size={16} color="hsl(238 45% 16%)" />
                  <Text>Nieuwste eerst</Text>
                </DropdownMenuItem>
                <DropdownMenuItem onPress={() => setSortBy('ending')}>
                  <ArrowUpDown size={16} color="hsl(238 45% 16%)" />
                  <Text>Bijna afgelopen</Text>
                </DropdownMenuItem>
                <DropdownMenuItem onPress={() => setSortBy('popular')}>
                  <Heart size={16} color="hsl(238 45% 16%)" />
                  <Text>Meeste likes</Text>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </View>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {categories.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-4 h-9 rounded-full items-center justify-center ${
                  active ? 'bg-primary' : 'bg-white border border-border'
                }`}>
                <Text
                  className={`text-sm font-poppins-600 ${
                    active ? 'text-white' : 'text-foreground'
                  }`}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View className="px-4 gap-4 pt-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-muted-foreground text-lg font-poppins-600">
              Nog geen items in je buurt
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              Wees de eerste die iets weggeeft!
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="mb-4">
                <PostCard post={item} />
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="hsl(231 100% 71%)"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

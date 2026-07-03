import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, Clock, Heart, Search, SlidersHorizontal } from 'lucide-react-native';

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
  const { data: posts, isLoading } = usePosts();
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
    imageUrl: post.images[0]?.image_url || 'https://via.placeholder.com/400x300?text=Geen+foto',
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
      <View className="px-4 pt-4 pb-2 bg-background">
        <View className="flex-row gap-2">
          <View className="flex-1 relative">
            <View className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
              <Search size={20} color="hsl(213 20% 46%)" />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Zoek in je buurt..."
              placeholderTextColor="hsl(213 20% 46%)"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-base text-foreground"
            />
          </View>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Pressable className="w-12 h-12 rounded-xl bg-card border border-border items-center justify-center">
                <SlidersHorizontal size={20} color="hsl(213 79% 13%)" />
              </Pressable>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <Text>Sorteren op</Text>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onPress={() => setSortBy('newest')}>
                <Clock size={16} color="hsl(213 79% 13%)" />
                <Text>Nieuwste eerst</Text>
              </DropdownMenuItem>
              <DropdownMenuItem onPress={() => setSortBy('ending')}>
                <ArrowUpDown size={16} color="hsl(213 79% 13%)" />
                <Text>Bijna afgelopen</Text>
              </DropdownMenuItem>
              <DropdownMenuItem onPress={() => setSortBy('popular')}>
                <Heart size={16} color="hsl(213 79% 13%)" />
                <Text>Meeste likes</Text>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-4"
          contentContainerClassName="px-4 gap-2">
          {categories.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full ${
                  active ? 'bg-primary' : 'bg-card border border-border'
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    active ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="px-4 gap-4 pt-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-muted-foreground text-lg font-semibold">
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
          contentContainerClassName="px-4 pt-2 pb-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="hsl(207 90% 54%)"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      </View>
    </View>
  );
}

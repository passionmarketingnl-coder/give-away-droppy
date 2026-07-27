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
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
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

// Feed header: alleen het gradient ∞-icoon (geen wordmark).
const brandIcon = require('../../assets/brand/icon.png');

// Categorie tints: elke categorie z'n eigen brand-tint (uit Huisstijl 2.0
// "Labels & Categorieën"). Active state → volle brand-kleur.
const CHIP_TINTS: Record<
  string,
  { bg: string; text: string; activeBg: string; activeText: string }
> = {
  Alles: { bg: '#F4F4F4', text: '#5A5D78', activeBg: '#16183A', activeText: '#FFF' },
  Meubels: { bg: '#EEF1FF', text: '#6880FF', activeBg: '#6880FF', activeText: '#FFF' },
  Kinderen: { bg: '#FDEAFB', text: '#C33BB4', activeBg: '#F65FE7', activeText: '#FFF' },
  Keuken: { bg: '#EFFDE9', text: '#3F9F52', activeBg: '#9FFA7F', activeText: '#16183A' },
  Elektronica: { bg: '#EEF1FF', text: '#6880FF', activeBg: '#6880FF', activeText: '#FFF' },
  Boeken: { bg: '#FDEAFB', text: '#C33BB4', activeBg: '#F65FE7', activeText: '#FFF' },
  Tuin: { bg: '#EFFDE9', text: '#3F9F52', activeBg: '#9FFA7F', activeText: '#16183A' },
  Sport: { bg: '#EEF1FF', text: '#6880FF', activeBg: '#6880FF', activeText: '#FFF' },
  Kleding: { bg: '#FDEAFB', text: '#C33BB4', activeBg: '#F65FE7', activeText: '#FFF' },
  Overig: { bg: '#F4F4F4', text: '#5A5D78', activeBg: '#16183A', activeText: '#FFF' },
};

const categories = Object.keys(CHIP_TINTS);

type SortBy = 'newest' | 'ending' | 'popular';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<PostCardData>);

export default function FeedScreen() {
  const router = useRouter();
  const { data: posts, isLoading } = usePosts();
  const { data: unreadCount } = useUnreadNotificationCount();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('Alles');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [refreshing, setRefreshing] = useState(false);

  // Scroll-collapse: hele header (logo+bell+search+chips) verdwijnt bij
  // scroll down. Bij scroll terug naar top komt de header weer terug.
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(scrollY.value, [0, 100], [500, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -40],
          Extrapolation.CLAMP,
        ),
      },
    ],
    overflow: 'hidden',
  }));

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

  // Toont alleen de plaatsnaam. Strip NL postcodes (1234AB met optionele
  // spatie) en huisnummers weg uit de display_location; pak het laatste
  // niet-lege deel na comma-split (meestal de woonplaats).
  const cleanLocation = (raw: string | null | undefined): string => {
    if (!raw) return '';
    const withoutPostcode = raw
      .replace(/\b\d{4}\s?[A-Z]{2}\b/gi, '')
      .trim();
    const parts = withoutPostcode
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.pop() || withoutPostcode || '';
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
    displayLocation: cleanLocation(post.display_location),
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
      {/* Complete header wrapper: collapse't bij scroll down (opacity + max-
          height + translateY). Bevat zowel de blauwe brand-header (logo,
          bell, search, filter) als de horizontale category-slider. */}
      <Animated.View style={headerStyle}>
        <View className="bg-primary pt-4 pb-4">
          <View className="max-w-lg mx-auto w-full px-4">
            <View className="flex-row items-center justify-between mb-4" style={{ height: 40 }}>
              <Image
                source={brandIcon}
                style={{ width: 64, height: 28 }}
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
        </View>

        {/* Category slider: horizontale ScrollView zodat alle chips langs
            elkaar staan, user swipet/scrollt om ze allemaal te zien. */}
        <View className="pt-3 pb-1">
          <View className="max-w-lg mx-auto w-full">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {categories.map((cat) => {
                const tint = CHIP_TINTS[cat];
                const active = cat === selectedCategory;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className="px-4 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: active ? tint.activeBg : tint.bg }}>
                    <Text
                      className="text-sm font-poppins-600"
                      style={{ color: active ? tint.activeText : tint.text }}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Animated.View>

      <View className="max-w-lg mx-auto w-full flex-1">
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
          <AnimatedFlatList
            data={filtered}
            keyExtractor={(item: PostCardData) => item.id}
            renderItem={({ item }: { item: PostCardData }) => (
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
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          />
        )}
      </View>
    </View>
  );
}

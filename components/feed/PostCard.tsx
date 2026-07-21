import { useRef, useState } from 'react';
import { Image, Platform, Pressable, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Flame, Heart, MapPin, Share2 } from 'lucide-react-native';

import StatusBadge, { type StatusType } from './StatusBadge';
import { Text } from '@/components/ui/text';
import { useToggleLike } from '@/lib/hooks/usePosts';

export interface PostCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  images: string[];
  likeCount: number;
  userHasLiked: boolean;
  status: StatusType;
  distance: string;
  timeLeft: string;
  posterName: string;
  posterAvatar: string;
  createdAt: string;
  displayLocation?: string;
}

interface PostCardProps {
  post: PostCardData;
}

// Simpele deterministische keuze uit brand-gradient varianten (Huisstijl 2.0).
// Op basis van post.id zodat elke placeholder consistent dezelfde combo krijgt.
const GRADIENT_VARIANTS: [string, string][] = [
  ['#9FFA7F', '#6880FF'], // groen → blauw
  ['#6880FF', '#F65FE7'], // blauw → roze
  ['#F65FE7', '#6880FF'], // roze → blauw
  ['#6880FF', '#9FFA7F'], // blauw → groen
];

function gradientForId(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % 10000;
  return GRADIENT_VARIANTS[hash % GRADIENT_VARIANTS.length];
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const toggleLike = useToggleLike();
  const lastTapRef = useRef(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  const isDummy = post.id.startsWith('demo-');
  const hasImage = !!post.imageUrl;
  const gradient = gradientForId(post.id);

  const handleLike = () => {
    if (isDummy) return;
    toggleLike.mutate({ postId: post.id, isLiked: post.userHasLiked });
  };

  const handleImageDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      if (isDummy) return;
      toggleLike.mutate({ postId: post.id, isLiked: post.userHasLiked });
      if (!post.userHasLiked) {
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 800);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.title} — bekijk op Droppi`,
        url: `https://droppi.app/post/${post.id}`,
        title: post.title,
      });
    } catch (e) {
      // user cancelled or platform niet ondersteund
    }
  };

  const handleOpen = () => {
    if (!isDummy) router.push(`/post/${post.id}`);
  };

  const isOldEnough = Date.now() - new Date(post.createdAt).getTime() >= 8 * 60 * 60 * 1000;
  const likesNeeded = 100 - post.likeCount;
  const showProgress = isOldEnough && likesNeeded > 0 && post.status === 'active';
  const progress = Math.min((post.likeCount / 100) * 100, 100);

  return (
    <Pressable
      onPress={handleOpen}
      className="bg-card rounded-2xl overflow-hidden"
      style={Platform.select({
        ios: { shadowColor: '#16183A', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
        android: { elevation: 3 },
        web: { boxShadow: '0 10px 30px rgba(20,24,58,0.08)' } as any,
      })}>
      <Pressable
        onPress={handleImageDoubleTap}
        className="relative w-full aspect-[4/3] overflow-hidden">
        {hasImage ? (
          <Image
            source={{ uri: post.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        )}
        {showHeartAnim && (
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <Heart size={80} fill="white" color="white" />
          </View>
        )}
        {/* Gratis pill (Huisstijl 2.0) */}
        <View className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white">
          <Text className="text-xs font-poppins-600 text-primary">Gratis</Text>
        </View>
        {/* Status badge naast Gratis wanneer relevant */}
        {post.status !== 'active' && (
          <View className="absolute top-3 left-20">
            <StatusBadge status={post.status} />
          </View>
        )}
        <Pressable
          onPress={handleShare}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 items-center justify-center">
          <Share2 size={16} color="#16183A" />
        </Pressable>
        {post.images.length > 1 && (
          <View className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-white/90">
            <Text className="text-xs font-poppins-600 text-foreground">
              1/{post.images.length}
            </Text>
          </View>
        )}
      </Pressable>

      <View className="p-4">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="font-heading text-xl text-foreground" numberOfLines={1}>
              {post.title}
            </Text>
            <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={2}>
              {post.description}
            </Text>
          </View>
          <Pressable
            onPress={handleLike}
            className="items-center min-w-[48px] py-1">
            <Heart
              size={26}
              color={post.userHasLiked ? '#F65FE7' : 'hsl(232 15% 55%)'}
              fill={post.userHasLiked ? '#F65FE7' : 'transparent'}
            />
            <Text
              className={`text-xs font-poppins-700 ${
                post.userHasLiked ? 'text-droppi-pink' : 'text-muted-foreground'
              }`}>
              {post.likeCount}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3 mt-3 flex-wrap">
          {(post.distance || post.displayLocation) && (
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color="hsl(232 15% 55%)" />
              <Text className="text-xs text-muted-foreground">
                {[post.displayLocation, post.distance].filter(Boolean).join(' · ')}
              </Text>
            </View>
          )}
          {post.timeLeft && (
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="hsl(232 15% 55%)" />
              <Text className="text-xs text-muted-foreground">{post.timeLeft}</Text>
            </View>
          )}
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#EEF1FF' }}>
            <Text className="text-xs font-poppins-600" style={{ color: '#6880FF' }}>
              {post.category}
            </Text>
          </View>
        </View>

        {showProgress && (
          <View className="mt-3 gap-1.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <Flame size={14} color="#6880FF" />
                <Text className="text-xs font-poppins-600 text-primary">
                  Nog {likesNeeded} likes tot de loting!
                </Text>
              </View>
              <Text className="text-xs font-poppins-700 text-foreground">{post.likeCount}/100</Text>
            </View>
            <View className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

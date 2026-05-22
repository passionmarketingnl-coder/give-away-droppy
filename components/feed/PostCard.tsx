import { useRef, useState } from 'react';
import { Image, Platform, Pressable, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
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

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const toggleLike = useToggleLike();
  const lastTapRef = useRef(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  const isDummy = post.id.startsWith('demo-');

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
        message: `${post.title} — bekijk op Droppy`,
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

  const isOldEnough = Date.now() - new Date(post.createdAt).getTime() >= 4 * 60 * 60 * 1000;
  const likesNeeded = 100 - post.likeCount;
  const showProgress = isOldEnough && likesNeeded > 0 && post.status === 'active';
  const progress = Math.min((post.likeCount / 100) * 100, 100);

  return (
    <Pressable
      onPress={handleOpen}
      className="bg-card rounded-xl overflow-hidden"
      style={Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 } },
        android: { elevation: 2 },
      })}>
      <Pressable
        onPress={handleImageDoubleTap}
        className="relative w-full aspect-[4/3] overflow-hidden">
        <Image
          source={{ uri: post.imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {showHeartAnim && (
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <Heart size={80} fill="white" color="white" />
          </View>
        )}
        <View className="absolute top-3 left-3">
          <StatusBadge status={post.status} />
        </View>
        <Pressable
          onPress={handleShare}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 items-center justify-center">
          <Share2 size={16} color="hsl(213 79% 13%)" />
        </Pressable>
        {post.images.length > 1 && (
          <View className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-card/80">
            <Text className="text-xs font-semibold text-foreground">
              1/{post.images.length}
            </Text>
          </View>
        )}
      </Pressable>

      <View className="p-4">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="font-bold text-base text-foreground" numberOfLines={1}>
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
              size={28}
              color={post.userHasLiked ? 'hsl(0 72% 51%)' : 'hsl(213 20% 46%)'}
              fill={post.userHasLiked ? 'hsl(0 72% 51%)' : 'transparent'}
            />
            <Text
              className={`text-xs font-bold ${
                post.userHasLiked ? 'text-destructive' : 'text-muted-foreground'
              }`}>
              {post.likeCount}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3 mt-3">
          {(post.distance || post.displayLocation) && (
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color="hsl(213 20% 46%)" />
              <Text className="text-xs text-muted-foreground">
                {[post.displayLocation, post.distance].filter(Boolean).join(' · ')}
              </Text>
            </View>
          )}
          {post.timeLeft && (
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="hsl(213 20% 46%)" />
              <Text className="text-xs text-muted-foreground">{post.timeLeft}</Text>
            </View>
          )}
          <View className="px-2 py-0.5 rounded-full bg-secondary">
            <Text className="text-xs font-semibold text-secondary-foreground">
              {post.category}
            </Text>
          </View>
        </View>

        {showProgress && (
          <View className="mt-3 gap-1.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <Flame size={14} color="hsl(207 90% 54%)" />
                <Text className="text-xs font-semibold text-primary">
                  Nog {likesNeeded} likes tot de loting!
                </Text>
              </View>
              <Text className="text-xs font-bold text-foreground">{post.likeCount}/100</Text>
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

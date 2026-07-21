import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Share2,
  Trophy,
} from 'lucide-react-native';

import CommentsSection from '@/components/post/CommentsSection';
import ReportDialog from '@/components/post/ReportDialog';
import StatusBadge from '@/components/feed/StatusBadge';
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
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';
import { useConversations } from '@/lib/hooks/useChats';
import { useConfirmPickup, useReroll } from '@/lib/hooks/usePostActions';
import { usePost, useToggleLike } from '@/lib/hooks/usePosts';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: post, isLoading } = usePost(id || '');
  const { data: conversations } = useConversations();
  const toggleLike = useToggleLike();
  const confirmPickup = useConfirmPickup();
  const reroll = useReroll();
  const [currentImage, setCurrentImage] = useState(0);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (kind: 'success' | 'error', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3000);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Loader2 size={32} color="hsl(207 90% 54%)" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-lg font-bold text-foreground">Post niet gevonden</Text>
        <Button variant="outline" onPress={() => router.replace('/')} className="mt-4">
          <Text>Terug naar feed</Text>
        </Button>
      </View>
    );
  }

  const images = post.images.map((img) => img.image_url);
  const posterInitial = post.poster ? post.poster.first_name.charAt(0).toUpperCase() : '?';
  const posterName = post.poster
    ? `${post.poster.first_name} ${post.poster.last_name.charAt(0)}.`
    : 'Onbekend';

  const isPoster = user?.id === post.user_id;
  const isRaffled = post.status === 'raffled' || post.status === 'reroll';
  const isPickedUp = post.status === 'picked_up';

  const conversation = conversations?.find((c) => c.post_id === post.id);

  const handleLike = () => {
    toggleLike.mutate({ postId: post.id, isLiked: post.user_has_liked });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: post.title,
        message: `Bekijk "${post.title}" op Droppi!`,
        url: `https://droppi.app/post/${post.id}`,
      });
    } catch {
      // user cancelled or unsupported
    }
  };

  const handleConfirmPickup = () => {
    confirmPickup.mutate(post.id, {
      onSuccess: () => showToast('success', 'Ophaling bevestigd! 🎉'),
      onError: (e) => showToast('error', e.message),
    });
  };

  const handleReroll = () => {
    reroll.mutate(post.id, {
      onSuccess: () => showToast('success', 'Nieuwe winnaar gekozen!'),
      onError: (e) => showToast('error', e.message),
    });
  };

  const handleGoToChat = () => {
    if (conversation) router.push(`/chat/${conversation.id}`);
  };

  const isOldEnough = Date.now() - new Date(post.created_at).getTime() >= 8 * 60 * 60 * 1000;
  const likesNeeded = 100 - post.like_count;
  const showProgress = isOldEnough && likesNeeded > 0 && post.status === 'active';
  const progress = Math.min((post.like_count / 100) * 100, 100);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1">
        <View className="relative aspect-[4/3] bg-muted">
          {images.length > 0 ? (
            <Image
              source={{ uri: images[currentImage] }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-muted-foreground">Geen afbeelding</Text>
            </View>
          )}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/80 items-center justify-center">
            <ArrowLeft size={20} color="hsl(213 79% 13%)" />
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/80 items-center justify-center">
            <Share2 size={20} color="hsl(213 79% 13%)" />
          </Pressable>
          {images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
              {images.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setCurrentImage(i)}
                  className={`h-2 rounded-full ${
                    i === currentImage ? 'bg-card w-6' : 'bg-card/50 w-2'
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        <View className="px-4 py-5 gap-5">
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <StatusBadge status={post.status as any} />
              <Text className="text-xs text-muted-foreground font-semibold">
                {post.category}
              </Text>
            </View>
            <Text className="text-3xl font-heading text-foreground">{post.title}</Text>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Clock size={16} color="hsl(213 20% 46%)" />
              <Text className="text-sm text-muted-foreground">
                {post.raffle_due_at
                  ? formatDistanceToNow(new Date(post.raffle_due_at), {
                      addSuffix: false,
                      locale: nl,
                    }) + ' over'
                  : 'Geen deadline'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Heart size={16} color="hsl(213 20% 46%)" />
              <Text className="text-sm text-muted-foreground">
                {post.like_count} deelnemers
              </Text>
            </View>
          </View>

          {showProgress && (
            <View className="gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Flame size={16} color="hsl(207 90% 54%)" />
                  <Text className="text-sm font-bold text-primary">
                    Nog {likesNeeded} likes tot de loting!
                  </Text>
                </View>
                <Text className="text-sm font-bold text-foreground">
                  {post.like_count}/100
                </Text>
              </View>
              <View className="h-2 rounded-full bg-secondary overflow-hidden">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          )}

          {isRaffled && (
            <View className="p-4 rounded-xl bg-droppy-gold/10 border border-droppy-gold/30 gap-3">
              <View className="flex-row items-center gap-2">
                <Trophy size={20} color="hsl(40 85% 55%)" />
                <Text className="font-bold text-foreground">Loting afgerond!</Text>
              </View>
              <Text className="text-sm text-muted-foreground">
                {isPoster
                  ? 'Er is een winnaar gekozen. Neem contact op via de chat om de ophaling te regelen.'
                  : 'De loting voor dit item is afgerond. De winnaar is op de hoogte gesteld.'}
              </Text>
              {conversation && (
                <Button onPress={handleGoToChat} variant="outline" className="w-full rounded-xl">
                  <MessageCircle size={16} color="hsl(213 79% 13%)" />
                  <Text>Open chat</Text>
                </Button>
              )}
            </View>
          )}

          {isPickedUp && (
            <View className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <View className="flex-row items-center gap-2">
                <CheckCircle size={20} color="hsl(207 90% 54%)" />
                <Text className="font-bold text-foreground">Opgehaald!</Text>
              </View>
              <Text className="text-sm text-muted-foreground mt-1">
                Dit item is succesvol opgehaald. Bedankt voor het delen!
              </Text>
            </View>
          )}

          {isPoster && isRaffled && (
            <View className="gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full h-12 rounded-xl"
                    disabled={confirmPickup.isPending}>
                    <CheckCircle size={20} color="white" />
                    <Text className="font-bold">
                      {confirmPickup.isPending ? 'Bezig...' : 'Bevestig ophaling'}
                    </Text>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <Text>Ophaling bevestigen?</Text>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <Text>
                        Hiermee bevestig je dat het item is opgehaald door de winnaar.
                        Dit kan niet ongedaan worden gemaakt.
                      </Text>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      <Text>Annuleren</Text>
                    </AlertDialogCancel>
                    <AlertDialogAction onPress={handleConfirmPickup}>
                      <Text>Bevestigen</Text>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border-destructive/30"
                    disabled={reroll.isPending}>
                    <RefreshCw size={20} color="hsl(0 72% 51%)" />
                    <Text className="font-bold text-destructive">
                      {reroll.isPending ? 'Bezig...' : 'Herverloting starten'}
                    </Text>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <Text>Herverloting starten?</Text>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <Text>
                        Reageerde de winnaar niet? Er wordt een nieuwe winnaar gekozen
                        uit de overige deelnemers. De vorige winnaar wordt uitgesloten.
                      </Text>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      <Text>Annuleren</Text>
                    </AlertDialogCancel>
                    <AlertDialogAction onPress={handleReroll}>
                      <Text>Herverloten</Text>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </View>
          )}

          <View className="flex-row items-center gap-3 py-3 border-y border-border">
            <View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center">
              <Text className="text-primary font-bold text-lg">{posterInitial}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-foreground">{posterName}</Text>
              <Text className="text-xs text-muted-foreground">
                Geplaatst{' '}
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: nl,
                })}
              </Text>
            </View>
            <ChevronRight size={20} color="hsl(213 20% 46%)" />
          </View>

          <View>
            <Text className="font-bold text-foreground mb-2">Beschrijving</Text>
            <Text className="text-sm text-muted-foreground leading-relaxed">
              {post.description}
            </Text>
          </View>

          {post.pickup_notes && (
            <View>
              <Text className="font-bold text-foreground mb-2">Ophaalvoorkeur</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                {post.pickup_notes}
              </Text>
            </View>
          )}

          <CommentsSection postId={post.id} />
          <ReportDialog postId={post.id} />
        </View>
      </ScrollView>

      {(post.status === 'active' || post.status === 'ending') && (
        <View className="px-4 py-4 bg-background border-t border-border">
          <Button
            onPress={handleLike}
            size="lg"
            className={`w-full h-14 rounded-xl ${
              post.user_has_liked ? 'bg-accent' : ''
            }`}>
            <Heart
              size={20}
              color="white"
              fill={post.user_has_liked ? 'white' : 'transparent'}
            />
            <Text className="font-bold">
              {post.user_has_liked ? 'Je doet mee! 🎉' : 'Doe mee aan de loting'}
            </Text>
          </Button>
        </View>
      )}

      {toast && (
        <View
          className={`absolute top-16 left-4 right-4 p-3 rounded-xl ${
            toast.kind === 'success'
              ? 'bg-droppy-success/10 border border-droppy-success'
              : 'bg-destructive/10 border border-destructive'
          }`}>
          <Text
            className={`text-sm ${
              toast.kind === 'success' ? 'text-droppy-success' : 'text-destructive'
            }`}>
            {toast.msg}
          </Text>
        </View>
      )}
    </View>
  );
}

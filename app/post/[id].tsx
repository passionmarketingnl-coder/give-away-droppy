import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  ArrowLeft,
  CheckCircle,
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
        <Loader2 size={32} color="hsl(231 100% 71%)" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-lg font-poppins-700 text-foreground">Post niet gevonden</Text>
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
  const canLike = post.status === 'active' || post.status === 'ending';

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1">
        {/* Image / gradient hero — in dezelfde max-w-lg container zodat op
            desktop de foto niet vol-breedte uitrekt maar in de kolom staat. */}
        <View className="max-w-lg mx-auto w-full">
          <View className="relative aspect-[4/3]">
            {images.length > 0 ? (
              <Image
                source={{ uri: images[currentImage] }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#6880FF', '#F65FE7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            )}
            <Pressable
              onPress={() => router.back()}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center">
              <ArrowLeft size={20} color="#16183A" />
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center">
              <Share2 size={20} color="#16183A" />
            </Pressable>
            {images.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
                {images.map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setCurrentImage(i)}
                    className={`h-2 rounded-full ${
                      i === currentImage ? 'bg-white w-6' : 'bg-white/50 w-2'
                    }`}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        <View className="max-w-lg mx-auto w-full px-4 py-5 gap-5">
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <StatusBadge status={post.status as any} />
              <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#EEF1FF' }}>
                <Text className="text-xs font-poppins-600" style={{ color: '#6880FF' }}>
                  {post.category}
                </Text>
              </View>
            </View>
            <Text className="text-3xl font-heading text-foreground">{post.title}</Text>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Clock size={16} color="hsl(232 15% 55%)" />
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
              <Heart size={16} color="hsl(232 15% 55%)" />
              <Text className="text-sm text-muted-foreground">
                {post.like_count} deelnemers
              </Text>
            </View>
          </View>

          {showProgress && (
            <View
              style={{
                borderWidth: 1,
                borderColor: 'rgba(104,128,255,0.24)',
                borderRadius: 20,
                overflow: 'hidden',
              }}>
              <LinearGradient
                colors={['rgba(104,128,255,0.18)', 'rgba(246,95,231,0.14)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16, gap: 8 }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <Flame size={16} color="#6880FF" />
                    <Text className="text-sm font-poppins-700 text-primary">
                      Nog {likesNeeded} likes tot de loting!
                    </Text>
                  </View>
                  <Text className="text-sm font-poppins-700 text-foreground">
                    {post.like_count}/100
                  </Text>
                </View>
                <View className="h-2 rounded-full bg-white/40 overflow-hidden">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </View>
              </LinearGradient>
            </View>
          )}

          {isRaffled && (
            <View
              style={{
                borderWidth: 1,
                borderColor: 'rgba(63,159,82,0.28)',
                borderRadius: 20,
                overflow: 'hidden',
              }}>
              <LinearGradient
                colors={['rgba(159,250,127,0.28)', 'rgba(159,250,127,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16, gap: 12 }}>
                <View className="flex-row items-center gap-2">
                  <Trophy size={20} color="#16183A" />
                  <Text className="font-poppins-700 text-foreground">Loting afgerond!</Text>
                </View>
                <Text className="text-sm text-foreground/80">
                  {isPoster
                    ? 'Er is een winnaar gekozen. Neem contact op via de chat om de ophaling te regelen.'
                    : 'De loting voor dit item is afgerond. De winnaar is op de hoogte gesteld.'}
                </Text>
                {conversation && (
                  <Button
                    onPress={handleGoToChat}
                    variant="outline"
                    className="w-full h-11 rounded-full bg-white">
                    <MessageCircle size={16} color="#16183A" />
                    <Text className="font-poppins-600">Open chat</Text>
                  </Button>
                )}
              </LinearGradient>
            </View>
          )}

          {isPickedUp && (
            <View
              style={{
                borderWidth: 1,
                borderColor: 'rgba(104,128,255,0.22)',
                borderRadius: 20,
                overflow: 'hidden',
              }}>
              <LinearGradient
                colors={['rgba(104,128,255,0.14)', 'rgba(104,128,255,0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16 }}>
                <View className="flex-row items-center gap-2">
                  <CheckCircle size={20} color="#6880FF" />
                  <Text className="font-poppins-700 text-foreground">Opgehaald!</Text>
                </View>
                <Text className="text-sm text-muted-foreground mt-1">
                  Dit item is succesvol opgehaald. Bedankt voor het delen!
                </Text>
              </LinearGradient>
            </View>
          )}

          {isPoster && isRaffled && (
            <View className="gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full h-12 rounded-full"
                    disabled={confirmPickup.isPending}>
                    <CheckCircle size={20} color="white" />
                    <Text className="font-poppins-700 text-white">
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
                    className="w-full h-12 rounded-full border-destructive/40"
                    disabled={reroll.isPending}>
                    <RefreshCw size={20} color="hsl(0 72% 51%)" />
                    <Text className="font-poppins-700 text-destructive">
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

          <View
            style={{
              borderWidth: 1,
              borderColor: 'rgba(104,128,255,0.18)',
              borderRadius: 20,
              overflow: 'hidden',
            }}>
            <LinearGradient
              colors={['rgba(104,128,255,0.1)', 'rgba(104,128,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
              <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(104,128,255,0.2)' }}>
                <Text className="text-primary font-poppins-700 text-lg">{posterInitial}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-poppins-700 text-foreground">{posterName}</Text>
                <Text className="text-xs text-muted-foreground">
                  Geplaatst{' '}
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: nl,
                  })}
                </Text>
              </View>
            </LinearGradient>
          </View>

          <View>
            <Text className="font-heading text-2xl text-foreground mb-2">Beschrijving</Text>
            <Text className="text-sm text-foreground/80 leading-relaxed">
              {post.description}
            </Text>
          </View>

          {post.pickup_notes && (
            <View>
              <Text className="font-heading text-2xl text-foreground mb-2">Ophaalvoorkeur</Text>
              <Text className="text-sm text-foreground/80 leading-relaxed">
                {post.pickup_notes}
              </Text>
            </View>
          )}

          <CommentsSection postId={post.id} />
          <ReportDialog postId={post.id} />
        </View>
      </ScrollView>

      {canLike && (
        <View className="px-4 py-4 bg-background border-t border-border">
          <View className="max-w-lg mx-auto w-full">
            <Pressable
              onPress={handleLike}
              className="w-full h-14 rounded-full overflow-hidden"
              style={Platform.select({
                ios: {
                  shadowColor: post.user_has_liked ? '#F65FE7' : '#6880FF',
                  shadowOpacity: 0.35,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 8 },
                },
                android: { elevation: 8 },
                web: {
                  boxShadow: post.user_has_liked
                    ? '0 8px 22px rgba(246,95,231,0.35)'
                    : '0 8px 22px rgba(104,128,255,0.35)',
                } as any,
              })}>
              <LinearGradient
                colors={
                  post.user_has_liked ? ['#F65FE7', '#6880FF'] : ['#6880FF', '#F65FE7']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                <Heart
                  size={20}
                  color="white"
                  fill={post.user_has_liked ? 'white' : 'transparent'}
                />
                <Text className="font-poppins-700 text-base text-white">
                  {post.user_has_liked ? 'Je doet mee! 🎉' : 'Doe mee aan de loting'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      )}

      {toast && (
        <View
          className={`absolute top-16 left-4 right-4 p-3 rounded-2xl ${
            toast.kind === 'success'
              ? 'bg-droppi-green/20 border border-droppi-green'
              : 'bg-destructive/10 border border-destructive'
          }`}>
          <Text
            className={`text-sm ${
              toast.kind === 'success' ? 'text-foreground' : 'text-destructive'
            }`}>
            {toast.msg}
          </Text>
        </View>
      )}
    </View>
  );
}

import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  CheckCircle,
  Dice5,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Trophy,
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { useConversations } from '@/lib/hooks/useChats';
import {
  useMarkNotificationRead,
  useNotifications,
} from '@/lib/hooks/useNotifications';

type IconComponent = typeof Bell;

const iconMap: Record<string, IconComponent> = {
  raffle_won: Trophy,
  comment: MessageCircle,
  reply: MessageCircle,
  raffle_completed: Dice5,
  reroll: RefreshCw,
  chat_message: MessageCircle,
  moderation: Bell,
  daily_update: MapPin,
  pickup_confirm: CheckCircle,
};

// Tint per notification-type. Gradient loopt links→rechts, sterker aan de
// icon-kant zodat de badge in z'n eigen kleur baadt en de tekst rustig blijft.
type Tint = {
  gradient: [string, string];
  gradientUnread: [string, string];
  iconBg: string;
  iconColor: string;
  border: string;
};

const BLUE: Tint = {
  gradient: ['rgba(104,128,255,0.12)', 'rgba(104,128,255,0.02)'],
  gradientUnread: ['rgba(104,128,255,0.22)', 'rgba(104,128,255,0.04)'],
  iconBg: 'rgba(104,128,255,0.18)',
  iconColor: '#6880FF',
  border: 'rgba(104,128,255,0.18)',
};
const PINK: Tint = {
  gradient: ['rgba(246,95,231,0.12)', 'rgba(246,95,231,0.02)'],
  gradientUnread: ['rgba(246,95,231,0.22)', 'rgba(246,95,231,0.04)'],
  iconBg: 'rgba(246,95,231,0.18)',
  iconColor: '#F65FE7',
  border: 'rgba(246,95,231,0.2)',
};
const GREEN: Tint = {
  gradient: ['rgba(159,250,127,0.18)', 'rgba(159,250,127,0.03)'],
  gradientUnread: ['rgba(159,250,127,0.32)', 'rgba(159,250,127,0.06)'],
  iconBg: 'rgba(159,250,127,0.28)',
  iconColor: '#3F9F52',
  border: 'rgba(63,159,82,0.24)',
};
const NEUTRAL: Tint = {
  gradient: ['rgba(90,93,120,0.08)', 'rgba(90,93,120,0.02)'],
  gradientUnread: ['rgba(90,93,120,0.14)', 'rgba(90,93,120,0.03)'],
  iconBg: 'rgba(90,93,120,0.14)',
  iconColor: '#5A5D78',
  border: 'rgba(90,93,120,0.16)',
};
const DESTRUCTIVE: Tint = {
  gradient: ['rgba(228,72,72,0.14)', 'rgba(228,72,72,0.02)'],
  gradientUnread: ['rgba(228,72,72,0.24)', 'rgba(228,72,72,0.04)'],
  iconBg: 'rgba(228,72,72,0.18)',
  iconColor: '#D93838',
  border: 'rgba(228,72,72,0.2)',
};

const tintMap: Record<string, Tint> = {
  raffle_won: GREEN,
  comment: BLUE,
  reply: BLUE,
  raffle_completed: NEUTRAL,
  reroll: PINK,
  chat_message: BLUE,
  moderation: DESTRUCTIVE,
  daily_update: BLUE,
  pickup_confirm: GREEN,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const { data: conversations } = useConversations();
  const markRead = useMarkNotificationRead();

  const handleClick = (notif: any) => {
    if (!notif.is_read) markRead.mutate(notif.id);

    if (notif.type === 'daily_update') {
      router.push('/');
      return;
    }

    if (
      (notif.type === 'raffle_won' ||
        notif.type === 'chat_message' ||
        notif.type === 'raffle_completed') &&
      notif.post_id
    ) {
      const convo = conversations?.find((c) => c.post_id === notif.post_id);
      if (convo) {
        router.push(`/chat/${convo.id}`);
        return;
      }
    }

    if (notif.post_id) {
      router.push(`/post/${notif.post_id}`);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ backgroundColor: "#18193f" }} className="pt-4 pb-5">
        <View className="max-w-lg mx-auto w-full px-4">
          <Text className="text-3xl font-heading text-white">Meldingen</Text>
        </View>
      </View>

      <View className="max-w-lg mx-auto w-full flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Loader2 size={24} color="hsl(231 100% 71%)" />
          </View>
        ) : !notifications || notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
              <Bell size={32} color="hsl(232 15% 55%)" />
            </View>
            <Text className="font-poppins-600 text-foreground mb-1">Geen meldingen</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Hier zie je updates over je lotingen en berichten.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 10 }}
            renderItem={({ item }) => {
              const Icon = iconMap[item.type] || Bell;
              const tint = tintMap[item.type] || NEUTRAL;
              const gradient = item.is_read ? tint.gradient : tint.gradientUnread;
              return (
                <Pressable
                  onPress={() => handleClick(item)}
                  style={{
                    borderWidth: 1,
                    borderColor: tint.border,
                    borderRadius: 20,
                    overflow: 'hidden',
                  }}>
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 14,
                    }}>
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: tint.iconBg }}>
                      <Icon size={20} color={tint.iconColor} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-poppins-700 text-foreground text-sm flex-1" numberOfLines={1}>
                          {item.title}
                        </Text>
                        {!item.is_read && (
                          <View className="w-2 h-2 rounded-full bg-droppi-pink ml-2" />
                        )}
                      </View>
                      <Text className="text-sm text-muted-foreground mt-0.5">
                        {item.body}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: nl,
                        })}
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

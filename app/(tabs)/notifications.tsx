import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
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

const colorMap: Record<string, { bg: string; iconColor: string }> = {
  raffle_won: { bg: 'bg-droppi-green/20', iconColor: 'hsl(238 45% 16%)' },
  comment: { bg: 'bg-primary/10', iconColor: 'hsl(231 100% 71%)' },
  reply: { bg: 'bg-primary/10', iconColor: 'hsl(231 100% 71%)' },
  raffle_completed: { bg: 'bg-secondary', iconColor: 'hsl(232 15% 55%)' },
  reroll: { bg: 'bg-droppi-pink/15', iconColor: 'hsl(305 89% 67%)' },
  chat_message: { bg: 'bg-primary/10', iconColor: 'hsl(231 100% 71%)' },
  moderation: { bg: 'bg-destructive/10', iconColor: 'hsl(0 72% 51%)' },
  daily_update: { bg: 'bg-primary/10', iconColor: 'hsl(231 100% 71%)' },
  pickup_confirm: { bg: 'bg-droppi-green/20', iconColor: 'hsl(238 45% 16%)' },
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
            renderItem={({ item }) => {
              const Icon = iconMap[item.type] || Bell;
              const colors = colorMap[item.type] || {
                bg: 'bg-secondary',
                iconColor: 'hsl(232 15% 55%)',
              };
              return (
                <Pressable
                  onPress={() => handleClick(item)}
                  className={`flex-row items-start gap-3 px-4 py-4 border-b border-border ${
                    !item.is_read ? 'bg-primary/5' : ''
                  }`}>
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${colors.bg}`}>
                    <Icon size={20} color={colors.iconColor} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-poppins-700 text-foreground text-sm" numberOfLines={1}>
                        {item.title}
                      </Text>
                      {!item.is_read && (
                        <View className="w-2 h-2 rounded-full bg-droppi-pink" />
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
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Loader2, MessageCircle } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { useConversations, type Conversation } from '@/lib/hooks/useChats';

const statusLabels: Record<string, string> = {
  open: 'Open',
  pickup_planned: 'Ophalen gepland',
  completed: 'Afgerond',
};

// Gradient per gesprek-status. Open = puur blauw, pickup = blauw→roze
// mix (matcht met loot-CTA), completed = groen (win/succes).
type ChatTint = {
  gradient: [string, string];
  border: string;
  avatarBg: string;
  avatarText: string;
};

const chatTintMap: Record<string, ChatTint> = {
  open: {
    gradient: ['rgba(104,128,255,0.14)', 'rgba(104,128,255,0.02)'],
    border: 'rgba(104,128,255,0.2)',
    avatarBg: 'rgba(104,128,255,0.2)',
    avatarText: '#6880FF',
  },
  pickup_planned: {
    gradient: ['rgba(104,128,255,0.16)', 'rgba(246,95,231,0.16)'],
    border: 'rgba(246,95,231,0.22)',
    avatarBg: 'rgba(246,95,231,0.2)',
    avatarText: '#F65FE7',
  },
  completed: {
    gradient: ['rgba(159,250,127,0.2)', 'rgba(159,250,127,0.04)'],
    border: 'rgba(63,159,82,0.24)',
    avatarBg: 'rgba(159,250,127,0.3)',
    avatarText: '#3F9F52',
  },
};
const DEFAULT_CHAT_TINT = chatTintMap.open;

export default function ChatsScreen() {
  const router = useRouter();
  const { data: conversations, isLoading } = useConversations();

  return (
    <View className="flex-1 bg-background">
      <View style={{ backgroundColor: "#18193f" }} className="pt-4 pb-5">
        <View className="max-w-lg mx-auto w-full px-4">
          <Text className="text-3xl font-heading text-white">Berichten</Text>
        </View>
      </View>

      <View className="max-w-lg mx-auto w-full flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Loader2 size={24} color="hsl(231 100% 71%)" />
          </View>
        ) : !conversations || conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
              <MessageCircle size={32} color="hsl(232 15% 55%)" />
            </View>
            <Text className="font-poppins-600 text-foreground mb-1">Nog geen berichten</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Na een loting kun je hier chatten met de gever of winnaar.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 10 }}
            renderItem={({ item }: { item: Conversation }) => {
              const tint = chatTintMap[item.status] || DEFAULT_CHAT_TINT;
              return (
                <Pressable
                  onPress={() => router.push(`/chat/${item.id}`)}
                  style={{
                    borderWidth: 1,
                    borderColor: tint.border,
                    borderRadius: 20,
                    overflow: 'hidden',
                  }}>
                  <LinearGradient
                    colors={tint.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                    }}>
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: tint.avatarBg }}>
                      <Text
                        className="font-poppins-700 text-lg"
                        style={{ color: tint.avatarText }}>
                        {item.other_user_initial}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-poppins-700 text-foreground text-sm flex-1" numberOfLines={1}>
                          {item.other_user_name}
                        </Text>
                        <Text className="text-xs text-muted-foreground ml-2">
                          {item.last_message_time
                            ? formatDistanceToNow(new Date(item.last_message_time), {
                                addSuffix: true,
                                locale: nl,
                              })
                            : ''}
                        </Text>
                      </View>
                      <Text className="text-xs text-primary font-poppins-600" numberOfLines={1}>
                        {item.post_title}
                      </Text>
                      <Text
                        className="text-sm text-muted-foreground mt-0.5"
                        numberOfLines={1}>
                        {item.last_message || 'Nog geen berichten, begin het gesprek!'}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-[10px] text-muted-foreground font-poppins-500">
                        {statusLabels[item.status] || item.status}
                      </Text>
                      <ChevronRight size={16} color="hsl(232 15% 55%)" />
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

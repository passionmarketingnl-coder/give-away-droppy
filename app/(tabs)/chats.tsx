import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronRight, Loader2, MessageCircle } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { useConversations, type Conversation } from '@/lib/hooks/useChats';

const statusLabels: Record<string, string> = {
  open: 'Open',
  pickup_planned: 'Ophalen gepland',
  completed: 'Afgerond',
};

export default function ChatsScreen() {
  const router = useRouter();
  const { data: conversations, isLoading } = useConversations();

  return (
    <View className="flex-1 bg-background">
      <View className="bg-primary pt-4 pb-5">
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
            renderItem={({ item }: { item: Conversation }) => (
              <Pressable
                onPress={() => router.push(`/chat/${item.id}`)}
                className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-primary font-poppins-700 text-lg">
                    {item.other_user_initial}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-poppins-700 text-foreground text-sm" numberOfLines={1}>
                      {item.other_user_name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
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
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}

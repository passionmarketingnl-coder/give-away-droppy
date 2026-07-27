import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Loader2, Send } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  useConversations,
  useMessages,
  useSendMessage,
  type Message,
} from '@/lib/hooks/useChats';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: conversations } = useConversations();
  const { data: messages, isLoading } = useMessages(id || '');
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const conversation = conversations?.find((c) => c.id === id);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !id) return;
    sendMessage.mutate({ conversationId: id, body: text.trim() });
    setText('');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Brand app-header (full-width) met poster info */}
      <View style={{ backgroundColor: "#18193f" }} className="pt-4 pb-4">
        <View className="max-w-lg mx-auto w-full px-4 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>
          <View className="w-10 h-10 rounded-full bg-white/25 items-center justify-center">
            <Text className="text-white font-poppins-700 text-lg">
              {conversation?.other_user_initial || '?'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-poppins-700 text-white text-sm" numberOfLines={1}>
              {conversation?.other_user_name || 'Chat'}
            </Text>
            <Text className="text-xs text-white/85 font-poppins-500" numberOfLines={1}>
              {conversation?.post_title || ''}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1 max-w-lg mx-auto w-full">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Loader2 size={24} color="hsl(231 100% 71%)" />
          </View>
        ) : !messages || messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View
              style={{
                borderWidth: 1,
                borderColor: 'rgba(246,95,231,0.22)',
                borderRadius: 24,
                overflow: 'hidden',
                width: '100%',
                maxWidth: 320,
              }}>
              <LinearGradient
                colors={['rgba(104,128,255,0.16)', 'rgba(246,95,231,0.16)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20, alignItems: 'center' }}>
                <Text className="text-foreground text-sm text-center font-poppins-500">
                  Begin het gesprek! Spreek af wanneer het item opgehaald kan worden.
                </Text>
              </LinearGradient>
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 py-4 gap-3"
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => {
              const isMine = item.sender_user_id === user?.id;
              const timestamp = formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: nl,
              });
              if (isMine) {
                return (
                  <View className="items-end">
                    <View
                      style={{
                        maxWidth: '75%',
                        borderRadius: 20,
                        borderBottomRightRadius: 6,
                        overflow: 'hidden',
                      }}>
                      <LinearGradient
                        colors={['#6880FF', '#F65FE7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                        <Text className="text-sm text-white">{item.body}</Text>
                        <Text className="text-[10px] mt-1 font-poppins-500 text-white/70">
                          {timestamp}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                );
              }
              return (
                <View className="items-start">
                  <View
                    className="max-w-[75%] px-4 py-3 bg-white rounded-2xl rounded-bl-md"
                    style={{ borderWidth: 1, borderColor: 'rgba(104,128,255,0.18)' }}>
                    <Text className="text-sm text-foreground">{item.body}</Text>
                    <Text className="text-[10px] mt-1 font-poppins-500 text-muted-foreground">
                      {timestamp}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      <View className="px-4 py-3 border-t border-border bg-background">
        <View className="max-w-lg mx-auto w-full flex-row items-center gap-2">
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            placeholder="Typ een bericht..."
            placeholderTextColor="hsl(232 15% 55%)"
            className="flex-1 h-12 px-5 rounded-full bg-card border border-border text-sm text-foreground font-sans"
            style={Platform.select({ web: { outline: 'none' } as any })}
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className={`w-12 h-12 rounded-full overflow-hidden ${
              !text.trim() || sendMessage.isPending ? 'opacity-50' : ''
            }`}
            style={
              !text.trim() || sendMessage.isPending
                ? undefined
                : Platform.select({
                    ios: {
                      shadowColor: '#F65FE7',
                      shadowOpacity: 0.45,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 6 },
                    },
                    android: { elevation: 6 },
                    web: { boxShadow: '0 6px 16px rgba(246,95,231,0.45)' } as any,
                  })
            }>
            <LinearGradient
              colors={['#6880FF', '#F65FE7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Send size={20} color="white" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

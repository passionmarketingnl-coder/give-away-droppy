import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { Loader2, MessageCircle, Send } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useAddComment, useComments } from '@/lib/hooks/useComments';
import { useAuth } from '@/lib/hooks/useAuth';

interface CommentsSectionProps {
  postId: string;
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useComments(postId);
  const addComment = useAddComment();
  const [body, setBody] = useState('');

  const handleSubmit = () => {
    if (!body.trim()) return;
    addComment.mutate(
      { postId, body: body.trim() },
      { onSuccess: () => setBody('') }
    );
  };

  const canSend = !!body.trim() && !addComment.isPending;

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <MessageCircle size={20} color="hsl(238 45% 16%)" />
        <Text className="font-bold text-foreground">
          Vragen ({comments?.length || 0})
        </Text>
      </View>

      {user && (
        <View className="flex-row gap-2 items-end">
          <Textarea
            placeholder="Stel een vraag..."
            value={body}
            onChangeText={setBody}
            className="flex-1 min-h-[44px] rounded-xl"
          />
          {/* Send-knop in logo-gradient, matcht chat send */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSend}
            className={`rounded-xl h-11 w-11 overflow-hidden ${
              !canSend ? 'opacity-50' : ''
            }`}>
            <LinearGradient
              colors={['#6880FF', '#F65FE7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {addComment.isPending ? (
                <Loader2 size={16} color="white" />
              ) : (
                <Send size={16} color="white" />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View className="items-center py-4">
          <Loader2 size={20} color="hsl(232 15% 55%)" />
        </View>
      ) : comments && comments.length > 0 ? (
        <View className="gap-2.5">
          {comments.map((comment) => (
            <View
              key={comment.id}
              style={{
                borderWidth: 1,
                borderColor: 'rgba(104,128,255,0.14)',
                borderRadius: 16,
                overflow: 'hidden',
              }}>
              <LinearGradient
                colors={['rgba(104,128,255,0.07)', 'rgba(104,128,255,0.01)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(104,128,255,0.16)' }}>
                  <Text className="text-primary font-bold text-xs">
                    {comment.user_initial}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-sm font-bold text-foreground">
                      {comment.user_name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </Text>
                  </View>
                  <Text className="text-sm text-muted-foreground mt-0.5">
                    {comment.body}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-muted-foreground">
          Nog geen vragen. Stel de eerste!
        </Text>
      )}
    </View>
  );
}

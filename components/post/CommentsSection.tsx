import { useState } from 'react';
import { View } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Loader2, MessageCircle, Send } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
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

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <MessageCircle size={20} color="hsl(238 45% 16%)" />
        <Text className="font-bold text-foreground">
          Vragen ({comments?.length || 0})
        </Text>
      </View>

      {user && (
        <View className="flex-row gap-2">
          <Textarea
            placeholder="Stel een vraag..."
            value={body}
            onChangeText={setBody}
            className="flex-1 min-h-[44px] rounded-xl"
          />
          <Button
            size="icon"
            onPress={handleSubmit}
            disabled={!body.trim() || addComment.isPending}
            className="rounded-xl h-11 w-11">
            {addComment.isPending ? (
              <Loader2 size={16} color="white" />
            ) : (
              <Send size={16} color="white" />
            )}
          </Button>
        </View>
      )}

      {isLoading ? (
        <View className="items-center py-4">
          <Loader2 size={20} color="hsl(232 15% 55%)" />
        </View>
      ) : comments && comments.length > 0 ? (
        <View className="gap-3">
          {comments.map((comment) => (
            <View key={comment.id} className="flex-row gap-3">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
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

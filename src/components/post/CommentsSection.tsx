import { useState } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments, useAddComment } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface CommentsSectionProps {
  postId: string;
}

const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { data: comments, isLoading } = useComments(postId);
  const addComment = useAddComment();
  const [body, setBody] = useState("");

  const handleSubmit = () => {
    if (!body.trim()) return;
    addComment.mutate({ postId, body: body.trim() }, {
      onSuccess: () => setBody(""),
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Vragen ({comments?.length || 0})
      </h3>

      {user && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Stel een vraag..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[44px] text-sm rounded-xl resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!body.trim() || addComment.isPending}
            className="rounded-xl h-11 w-11 flex-shrink-0"
          >
            {addComment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xs">{comment.user_initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-foreground">{comment.user_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: nl })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nog geen vragen. Stel de eerste!</p>
      )}
    </div>
  );
};

export default CommentsSection;

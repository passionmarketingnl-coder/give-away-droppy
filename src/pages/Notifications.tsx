import { Heart, MessageCircle, Trophy, RefreshCw, Bell, Loader2 } from "lucide-react";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useChats";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const iconMap: Record<string, any> = {
  raffle_won: Trophy,
  comment: MessageCircle,
  reply: MessageCircle,
  raffle_completed: Heart,
  reroll: RefreshCw,
  chat_message: MessageCircle,
  moderation: Bell,
};

const colorMap: Record<string, { bg: string; text: string }> = {
  raffle_won: { bg: "bg-droppy-gold/15", text: "text-droppy-gold" },
  comment: { bg: "bg-primary/10", text: "text-primary" },
  reply: { bg: "bg-primary/10", text: "text-primary" },
  raffle_completed: { bg: "bg-secondary", text: "text-muted-foreground" },
  reroll: { bg: "bg-accent/10", text: "text-accent" },
  chat_message: { bg: "bg-primary/10", text: "text-primary" },
  moderation: { bg: "bg-destructive/10", text: "text-destructive" },
};

const Notifications = () => {
  const { data: notifications, isLoading } = useNotifications();
  const { data: conversations } = useConversations();
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) markRead.mutate(notif.id);

    // For raffle_won and raffle_completed, navigate to the chat for that post
    if ((notif.type === "raffle_won" || notif.type === "raffle_completed") && notif.post_id) {
      const convo = conversations?.find((c) => c.post_id === notif.post_id);
      if (convo) {
        navigate(`/chat/${convo.id}`);
        return;
      }
    }

    // For chat_message, find the conversation
    if (notif.type === "chat_message" && notif.post_id) {
      const convo = conversations?.find((c) => c.post_id === notif.post_id);
      if (convo) {
        navigate(`/chat/${convo.id}`);
        return;
      }
    }

    // For comments/replies and other post-related, go to post
    if (notif.post_id) {
      navigate(`/post/${notif.post_id}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-3">
        <h1 className="text-2xl font-extrabold text-foreground">Meldingen</h1>
      </header>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-foreground mb-1">Geen meldingen</h3>
          <p className="text-sm text-muted-foreground">
            Hier zie je updates over je lotingen en berichten.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {(notifications || []).map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            const colors = colorMap[notif.type] || { bg: "bg-secondary", text: "text-muted-foreground" };
            return (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-4 tap-highlight-none text-left ${
                  !notif.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{notif.title}</span>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: nl })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;

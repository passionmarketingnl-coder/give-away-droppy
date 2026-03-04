import { MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useChats";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  open: "Open",
  pickup_planned: "Ophalen gepland",
  completed: "Afgerond",
};

const Chats = () => {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-3">
        <h1 className="text-2xl font-extrabold text-foreground">Berichten</h1>
      </header>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (!conversations || conversations.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-foreground mb-1">Nog geen berichten</h3>
          <p className="text-sm text-muted-foreground">
            Na een loting kun je hier chatten met de gever of winnaar.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {(conversations || []).map((chat) => (
            <button
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="w-full flex items-center gap-3 px-4 py-4 tap-highlight-none text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-lg">{chat.other_user_initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">{chat.other_user_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {chat.last_message_time
                      ? formatDistanceToNow(new Date(chat.last_message_time), { addSuffix: true, locale: nl })
                      : ""}
                  </span>
                </div>
                <p className="text-xs text-primary font-semibold">{chat.post_title}</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {chat.last_message || "Nog geen berichten — begin het gesprek!"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {statusLabels[chat.status] || chat.status}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chats;

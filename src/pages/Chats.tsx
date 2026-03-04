import { MessageCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockChats = [
  {
    id: "1",
    name: "Lisa M.",
    item: "IKEA Kallax kast wit",
    lastMessage: "Top, dan kom ik morgenochtend langs!",
    time: "14:32",
    unread: 2,
    status: "Open",
  },
  {
    id: "2",
    name: "Jeroen K.",
    item: "Kinderfiets 16 inch",
    lastMessage: "Kun je het ook vanavond brengen?",
    time: "Gisteren",
    unread: 0,
    status: "Ophalen gepland",
  },
  {
    id: "3",
    name: "Fatima A.",
    item: "Box met babykleding",
    lastMessage: "Bedankt voor het weggeven! 🙏",
    time: "2 dagen",
    unread: 0,
    status: "Afgerond",
  },
];

const Chats = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-3">
        <h1 className="text-2xl font-extrabold text-foreground">Berichten</h1>
      </header>

      {mockChats.length === 0 ? (
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
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              className="w-full flex items-center gap-3 px-4 py-4 tap-highlight-none text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-lg">{chat.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">{chat.name}</span>
                  <span className="text-xs text-muted-foreground">{chat.time}</span>
                </div>
                <p className="text-xs text-primary font-semibold">{chat.item}</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{chat.lastMessage}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {chat.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
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

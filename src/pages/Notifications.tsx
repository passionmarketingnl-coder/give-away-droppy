import { Heart, MessageCircle, Trophy, RefreshCw, Bell } from "lucide-react";

const mockNotifications = [
  {
    id: "1",
    type: "won",
    icon: Trophy,
    title: "Je hebt gewonnen! 🎉",
    body: "Je hebt de IKEA Kallax kast gewonnen. Regel het ophalen via de chat.",
    time: "2 uur geleden",
    read: false,
  },
  {
    id: "2",
    type: "comment",
    icon: MessageCircle,
    title: "Nieuwe vraag",
    body: 'Pieter D. vroeg: "Past deze in een kleine auto?"',
    time: "3 uur geleden",
    read: false,
  },
  {
    id: "3",
    type: "raffle",
    icon: Heart,
    title: "Loting voltooid",
    body: "De loting voor je Samsung magnetron is afgerond. Bekijk de winnaar.",
    time: "5 uur geleden",
    read: true,
  },
  {
    id: "4",
    type: "reroll",
    icon: RefreshCw,
    title: "Herverloting",
    body: "Er is een herverloting gedaan voor de Kinderfiets. Nieuwe winnaar geselecteerd.",
    time: "1 dag geleden",
    read: true,
  },
];

const Notifications = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-3">
        <h1 className="text-2xl font-extrabold text-foreground">Meldingen</h1>
      </header>

      {mockNotifications.length === 0 ? (
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
          {mockNotifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <button
                key={notif.id}
                className={`w-full flex items-start gap-3 px-4 py-4 tap-highlight-none text-left ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.type === "won"
                      ? "bg-droppy-gold/15"
                      : notif.type === "comment"
                      ? "bg-primary/10"
                      : notif.type === "reroll"
                      ? "bg-accent/10"
                      : "bg-secondary"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      notif.type === "won"
                        ? "text-droppy-gold"
                        : notif.type === "comment"
                        ? "text-primary"
                        : notif.type === "reroll"
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">{notif.time}</span>
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

import { ChevronRight, MapPin, Package, Trophy, LogOut, Trash2, Edit3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Gebruiker";

  const initials = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name.charAt(0)}${(user.user_metadata.last_name || "").charAt(0)}`
    : "?";

  const menuItems = [
    { icon: Package, label: "Mijn weggeefacties", to: "#" },
    { icon: Trophy, label: "Gewonnen items", to: "#" },
    { icon: Edit3, label: "Profiel bewerken", to: "#" },
    { icon: MapPin, label: "Adres wijzigen", to: "#" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Profiel</h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-extrabold text-3xl">{initials}</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-2 mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-4 bg-card rounded-xl droppy-shadow tap-highlight-none"
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="flex-1 text-left font-semibold text-foreground">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-8 space-y-2 pb-8">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-4 bg-card rounded-xl tap-highlight-none"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
          <span className="flex-1 text-left font-semibold text-foreground">Uitloggen</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-4 bg-card rounded-xl tap-highlight-none">
          <Trash2 className="w-5 h-5 text-destructive" />
          <span className="flex-1 text-left font-semibold text-destructive">Account verwijderen</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;

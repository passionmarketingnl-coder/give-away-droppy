import { ChevronRight, MapPin, Package, Trophy, LogOut, Trash2, Edit3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Package, label: "Mijn weggeefacties", count: 3, to: "#" },
    { icon: Trophy, label: "Gewonnen items", count: 1, to: "#" },
    { icon: Edit3, label: "Profiel bewerken", to: "#" },
    { icon: MapPin, label: "Adres wijzigen", to: "#" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Profiel</h1>
        
        {/* Avatar & info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-extrabold text-3xl">JD</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Jan de Vries</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Amsterdam-Oost
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div className="bg-card rounded-xl p-4 text-center droppy-shadow">
            <p className="text-2xl font-extrabold text-primary">3</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Weggegeven</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center droppy-shadow">
            <p className="text-2xl font-extrabold text-droppy-gold">1</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Gewonnen</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center droppy-shadow">
            <p className="text-2xl font-extrabold text-foreground">12</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">Deelnames</p>
          </div>
        </div>
      </header>

      {/* Menu */}
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
              {item.count !== undefined && (
                <span className="text-sm text-muted-foreground font-semibold">{item.count}</span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Danger zone */}
      <div className="px-4 mt-8 space-y-2 pb-8">
        <button className="w-full flex items-center gap-3 px-4 py-4 bg-card rounded-xl tap-highlight-none">
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

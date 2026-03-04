import { ChevronRight, MapPin, Package, Trophy, LogOut, Trash2, Edit3, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyPosts, useWonPosts } from "@/hooks/useProfile";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  active: "Actief",
  ending: "Bijna afgelopen",
  raffled: "Verloot",
  picked_up: "Opgehaald",
  removed: "Verwijderd",
  reroll: "Herverloting",
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: myPosts, isLoading: postsLoading } = useMyPosts();
  const { data: wonPosts, isLoading: wonLoading } = useWonPosts();
  const [tab, setTab] = useState<"given" | "won">("given");

  const displayName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Gebruiker";

  const initials = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name.charAt(0)}${(user.user_metadata.last_name || "").charAt(0)}`
    : "?";

  const activePosts = tab === "given" ? myPosts : wonPosts;
  const loading = tab === "given" ? postsLoading : wonLoading;

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
            <div className="flex gap-4 mt-1">
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{myPosts?.length || 0}</strong> weggegeven
              </span>
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{wonPosts?.length || 0}</strong> gewonnen
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4">
        <button
          onClick={() => setTab("given")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            tab === "given" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
          }`}
        >
          <Package className="w-4 h-4 inline mr-1.5" />
          Mijn items
        </button>
        <button
          onClick={() => setTab("won")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            tab === "won" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-1.5" />
          Gewonnen
        </button>
      </div>

      {/* Items list */}
      <div className="px-4 space-y-3 pb-4 flex-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {!loading && (!activePosts || activePosts.length === 0) && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {tab === "given" ? "Je hebt nog niets weggegeven." : "Je hebt nog niets gewonnen."}
            </p>
          </div>
        )}
        {(activePosts || []).map((post) => (
          <button
            key={post.id}
            onClick={() => navigate(`/post/${post.id}`)}
            className="w-full flex items-center gap-3 px-3 py-3 bg-card rounded-xl droppy-shadow tap-highlight-none text-left"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              {post.images[0] ? (
                <img src={post.images[0].image_url} alt={post.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Geen foto</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">{post.title}</p>
              <span className={`text-xs font-semibold ${
                post.status === "active" || post.status === "ending" ? "text-primary" : "text-muted-foreground"
              }`}>
                {statusLabels[post.status] || post.status}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-2 pb-8">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-4 bg-card rounded-xl tap-highlight-none"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
          <span className="flex-1 text-left font-semibold text-foreground">Uitloggen</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;

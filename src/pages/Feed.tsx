import { Search, SlidersHorizontal } from "lucide-react";
import PostCard from "@/components/feed/PostCard";
import { motion } from "framer-motion";
import { usePosts } from "@/hooks/usePosts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const categories = ["Alles", "Meubels", "Kinderen", "Keuken", "Elektronica", "Boeken", "Tuin", "Sport", "Kleding", "Overig"];

const Feed = () => {
  const { data: posts, isLoading } = usePosts();
  const [selectedCategory, setSelectedCategory] = useState("Alles");
  const [search, setSearch] = useState("");

  const filtered = (posts || []).filter((p) => {
    if (selectedCategory !== "Alles" && p.category !== selectedCategory) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getTimeLeft = (raffleAt: string | null) => {
    if (!raffleAt) return "";
    const diff = new Date(raffleAt).getTime() - Date.now();
    if (diff <= 0) return "Verlopen";
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours}u over`;
    return `${Math.floor(diff / 60000)}m over`;
  };

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-extrabold text-foreground">
            <span className="text-primary">Droppy</span>
          </h1>
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center droppy-shadow">
            <SlidersHorizontal className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek in je buurt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors tap-highlight-none ${
                cat === selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 space-y-4 pb-4">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg font-semibold">Nog geen items in je buurt</p>
            <p className="text-muted-foreground text-sm mt-1">Wees de eerste die iets weggeeft!</p>
          </div>
        )}

        {filtered.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <PostCard
              post={{
                id: post.id,
                title: post.title,
                description: post.description,
                category: post.category,
                imageUrl: post.images[0]?.image_url || "/placeholder.svg",
                images: post.images.map((img) => img.id),
                likeCount: post.like_count,
                userHasLiked: post.user_has_liked,
                status: post.status as any,
                distance: "",
                timeLeft: getTimeLeft(post.raffle_due_at),
                posterName: post.poster ? `${post.poster.first_name} ${post.poster.last_name.charAt(0)}.` : "Onbekend",
                posterAvatar: post.poster?.avatar_url || "",
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Feed;

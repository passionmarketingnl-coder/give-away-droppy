import { Search, SlidersHorizontal, Loader2, ArrowUpDown, Clock, Heart } from "lucide-react";
import PostCard from "@/components/feed/PostCard";
import { motion } from "framer-motion";
import { usePosts } from "@/hooks/usePosts";
import { dummyPosts } from "@/data/dummyPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = ["Alles", "Meubels", "Kinderen", "Keuken", "Elektronica", "Boeken", "Tuin", "Sport", "Kleding", "Overig"];

const PULL_THRESHOLD = 80;

const Feed = () => {
  const { data: posts, isLoading } = usePosts();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("Alles");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "ending" | "popular">("newest");
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = document.querySelector("main");
    if (!container || container.scrollTop > 0) return;
    touchStartY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || refreshing) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD * 1.5));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.6);
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await new Promise((r) => setTimeout(r, 500));
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, queryClient]);

  useEffect(() => {
    const el = document.querySelector("main");
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    const container = document.querySelector("main");
    if (!container) return;
    const handleScroll = () => {
      const currentY = container.scrollTop;
      if (currentY <= 10) {
        setHeaderVisible(true);
      } else if (currentY > lastScrollY.current) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentY;
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const getTimeLeft = (raffleAt: string | null) => {
    if (!raffleAt) return "";
    const diff = new Date(raffleAt).getTime() - Date.now();
    if (diff <= 0) return "Verlopen";
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours}u over`;
    return `${Math.floor(diff / 60000)}m over`;
  };

  const hasPosts = (posts || []).length > 0;
  const feedItems = hasPosts
    ? (posts || []).map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description,
        category: post.category,
        imageUrl: post.images[0]?.image_url || "/placeholder.svg",
        images: post.images.map((img) => img.id),
        likeCount: post.like_count,
        userHasLiked: post.user_has_liked,
        status: post.status as any,
        distance: post.distance_km != null ? `${post.distance_km} km` : "",
        timeLeft: getTimeLeft(post.raffle_due_at),
        posterName: post.poster ? `${post.poster.first_name} ${post.poster.last_name.charAt(0)}.` : "Onbekend",
        posterAvatar: post.poster?.avatar_url || "",
        createdAt: post.created_at,
        displayLocation: post.display_location || "",
      }))
    : dummyPosts;

  const filtered = feedItems.filter((p) => {
    if (selectedCategory !== "Alles" && p.category !== selectedCategory) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "popular") return b.likeCount - a.likeCount;
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  return (
    <div className="flex flex-col">
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 || refreshing ? `${Math.max(pullDistance, refreshing ? 48 : 0)}px` : "0px" }}
      >
        <Loader2
          className={`w-5 h-5 text-primary transition-opacity ${refreshing ? "animate-spin opacity-100" : pullDistance >= PULL_THRESHOLD ? "opacity-100" : "opacity-40"}`}
        />
      </div>

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-2">
        {/* Logo row - hidden on mobile */}
        <div className="hidden md:flex items-center justify-between mb-3">
          <h1 className="text-2xl font-extrabold text-foreground">
            <span className="text-primary">Droppy</span>
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center droppy-shadow">
                <SlidersHorizontal className="w-5 h-5 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sorteren op</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("newest")} className={sortBy === "newest" ? "bg-accent" : ""}>
                <Clock className="w-4 h-4 mr-2" /> Nieuwste eerst
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("ending")} className={sortBy === "ending" ? "bg-accent" : ""}>
                <ArrowUpDown className="w-4 h-4 mr-2" /> Bijna afgelopen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("popular")} className={sortBy === "popular" ? "bg-accent" : ""}>
                <Heart className="w-4 h-4 mr-2" /> Meeste likes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: headerVisible ? "200px" : "0px", opacity: headerVisible ? 1 : 0 }}
        >
          {/* Search bar + filter button on mobile */}
          <div className="relative mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Zoek in je buurt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="md:hidden w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">
                  <SlidersHorizontal className="w-5 h-5 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sorteren op</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("newest")} className={sortBy === "newest" ? "bg-accent" : ""}>
                  <Clock className="w-4 h-4 mr-2" /> Nieuwste eerst
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("ending")} className={sortBy === "ending" ? "bg-accent" : ""}>
                  <ArrowUpDown className="w-4 h-4 mr-2" /> Bijna afgelopen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("popular")} className={sortBy === "popular" ? "bg-accent" : ""}>
                  <Heart className="w-4 h-4 mr-2" /> Meeste likes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <PostCard post={post} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Feed;

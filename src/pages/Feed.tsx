import { Search, SlidersHorizontal } from "lucide-react";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import { motion } from "framer-motion";

const mockPosts: PostCardData[] = [
  {
    id: "1",
    title: "IKEA Kallax kast wit",
    description: "Goed onderhouden Kallax kast met 4 vakken. Zelf ophalen, begane grond.",
    category: "Meubels",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=450&fit=crop",
    images: ["1", "2"],
    likeCount: 42,
    status: "active",
    distance: "1,2 km",
    timeLeft: "18u over",
    posterName: "Lisa M.",
    posterAvatar: "",
  },
  {
    id: "2",
    title: "Kinderfiets 16 inch",
    description: "Roze kinderfiets, lichte gebruikssporen maar rijdt prima. Inclusief zijwieltjes.",
    category: "Kinderen",
    imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&h=450&fit=crop",
    images: ["1"],
    likeCount: 89,
    status: "ending",
    distance: "3,4 km",
    timeLeft: "2u over",
    posterName: "Jeroen K.",
    posterAvatar: "",
  },
  {
    id: "3",
    title: "Box met babykleding 62-68",
    description: "Grote doos met rompertjes, pakjes en sokjes. Alles schoon en in goede staat.",
    category: "Babykleding",
    imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=450&fit=crop",
    images: ["1", "2", "3"],
    likeCount: 15,
    status: "active",
    distance: "0,8 km",
    timeLeft: "22u over",
    posterName: "Fatima A.",
    posterAvatar: "",
  },
  {
    id: "4",
    title: "Samsung magnetron",
    description: "Werkt perfect, we hebben een nieuwe gekocht. Zelf ophalen bij voordeur.",
    category: "Keuken",
    imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=450&fit=crop",
    images: ["1"],
    likeCount: 67,
    status: "active",
    distance: "5,1 km",
    timeLeft: "12u over",
    posterName: "Mark V.",
    posterAvatar: "",
  },
];

const categories = ["Alles", "Meubels", "Kinderen", "Keuken", "Elektronica", "Boeken", "Tuin", "Sport"];

const Feed = () => {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-extrabold text-foreground">
            <span className="text-primary">Droppy</span>
          </h1>
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center droppy-shadow">
            <SlidersHorizontal className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek in je buurt..."
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors tap-highlight-none ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Feed */}
      <div className="px-4 space-y-4 pb-4">
        {mockPosts.map((post, index) => (
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

import { Heart, MapPin, Clock, Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge, { type StatusType } from "./StatusBadge";

export interface PostCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  images: string[];
  likeCount: number;
  status: StatusType;
  distance: string;
  timeLeft: string;
  posterName: string;
  posterAvatar: string;
}

interface PostCardProps {
  post: PostCardData;
}

const PostCard = ({ post }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const navigate = useNavigate();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: post.title, url: `/post/${post.id}` });
    }
  };

  return (
    <article
      className="bg-card rounded-xl overflow-hidden droppy-shadow tap-highlight-none cursor-pointer"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={post.status} />
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center tap-highlight-none"
          >
            <Share2 className="w-4 h-4 text-foreground" />
          </button>
        </div>
        {post.images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-card/80 backdrop-blur-sm text-xs font-semibold text-foreground">
            1/{post.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-foreground truncate">{post.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{post.description}</p>
          </div>
          <button
            onClick={handleLike}
            className={`flex flex-col items-center gap-0.5 min-w-[48px] py-1 tap-highlight-none ${
              liked ? "animate-heart-pop" : ""
            }`}
          >
            <Heart
              className={`w-7 h-7 transition-all ${
                liked ? "fill-destructive text-destructive" : "text-muted-foreground"
              }`}
            />
            <span className={`text-xs font-bold ${liked ? "text-destructive" : "text-muted-foreground"}`}>
              {likeCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {post.distance}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.timeLeft}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
            {post.category}
          </span>
        </div>
      </div>
    </article>
  );
};

export default PostCard;

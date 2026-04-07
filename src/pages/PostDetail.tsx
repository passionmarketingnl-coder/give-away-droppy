import { ArrowLeft, Heart, Share2, MapPin, Clock, MessageCircle, ChevronRight, Loader2, Flame, Trophy, CheckCircle, RefreshCw } from "lucide-react";
import ReportDialog from "@/components/post/ReportDialog";
import CommentsSection from "@/components/post/CommentsSection";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/feed/StatusBadge";
import { usePost, useToggleLike } from "@/hooks/usePosts";
import { useConfirmPickup, useReroll } from "@/hooks/usePostActions";
import { useConversations } from "@/hooks/useChats";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { data: post, isLoading } = usePost(id || "");
  const { data: conversations } = useConversations();
  const toggleLike = useToggleLike();
  const confirmPickup = useConfirmPickup();
  const reroll = useReroll();
  const [currentImage, setCurrentImage] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="text-lg font-bold text-foreground">Post niet gevonden</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Terug naar feed</Button>
      </div>
    );
  }

  const images = post.images.map((img) => img.image_url);
  const posterInitial = post.poster ? post.poster.first_name.charAt(0).toUpperCase() : "?";
  const posterName = post.poster ? `${post.poster.first_name} ${post.poster.last_name.charAt(0)}.` : "Onbekend";

  const isPoster = user?.id === post.user_id;
  const isRaffled = post.status === "raffled" || post.status === "reroll";
  const isPickedUp = post.status === "picked_up";

  // Find conversation for this post
  const conversation = conversations?.find((c) => c.post_id === post.id);

  const handleLike = () => {
    toggleLike.mutate({ postId: post.id, isLiked: post.user_has_liked });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: `Bekijk "${post.title}" op Droppy!`, url });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link gekopieerd!");
    }
  };

  const handleConfirmPickup = () => {
    confirmPickup.mutate(post.id, {
      onSuccess: () => toast.success("Ophaling bevestigd! 🎉"),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleReroll = () => {
    reroll.mutate(post.id, {
      onSuccess: () => toast.success("Nieuwe winnaar gekozen!"),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleGoToChat = () => {
    if (conversation) {
      navigate(`/chat/${conversation.id}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-lg mx-auto">
      <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-muted">
        {images.length > 0 ? (
          <img src={images[currentImage]} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">Geen afbeelding</div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
        >
          <Share2 className="w-5 h-5 text-foreground" />
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? "bg-card w-6" : "bg-card/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={post.status as any} />
            <span className="text-xs text-muted-foreground font-semibold">{post.category}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{post.title}</h1>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {post.raffle_due_at
              ? formatDistanceToNow(new Date(post.raffle_due_at), { addSuffix: false, locale: nl }) + " over"
              : "Geen deadline"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            {post.like_count} deelnemers
          </span>
        </div>

        {/* Raffle progress bar */}
        {(() => {
          const isOldEnough = (Date.now() - new Date(post.created_at).getTime()) >= 4 * 60 * 60 * 1000;
          const likesNeeded = 100 - post.like_count;
          if (!isOldEnough || likesNeeded <= 0 || post.status !== "active") return null;
          const progress = Math.min((post.like_count / 100) * 100, 100);
          return (
            <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                  <Flame className="w-4 h-4" />
                  Nog {likesNeeded} likes tot de loting!
                </span>
                <span className="font-bold text-foreground">{post.like_count}/100</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Winner banner — shown when raffled */}
        {isRaffled && (
          <div className="p-4 rounded-xl bg-droppy-gold/10 border border-droppy-gold/30 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-droppy-gold" />
              <span className="font-bold text-foreground">Loting afgerond!</span>
            </div>
            {isPoster ? (
              <p className="text-sm text-muted-foreground">
                Er is een winnaar gekozen. Neem contact op via de chat om de ophaling te regelen.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                De loting voor dit item is afgerond. De winnaar is op de hoogte gesteld.
              </p>
            )}
            {conversation && (
              <Button onClick={handleGoToChat} className="w-full rounded-xl" variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                Open chat
              </Button>
            )}
          </div>
        )}

        {/* Picked up banner */}
        {isPickedUp && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">Opgehaald!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dit item is succesvol opgehaald. Bedankt voor het delen!
            </p>
          </div>
        )}

        {/* Poster actions for raffled posts */}
        {isPoster && isRaffled && (
          <div className="space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full h-12 rounded-xl font-bold" disabled={confirmPickup.isPending}>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {confirmPickup.isPending ? "Bezig..." : "Bevestig ophaling"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ophaling bevestigen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hiermee bevestig je dat het item is opgehaald door de winnaar. Dit kan niet ongedaan worden gemaakt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmPickup}>Bevestigen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-destructive border-destructive/30 hover:bg-destructive/5" disabled={reroll.isPending}>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  {reroll.isPending ? "Bezig..." : "Herverloting starten"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Herverloting starten?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Reageerde de winnaar niet? Er wordt een nieuwe winnaar gekozen uit de overige deelnemers. De vorige winnaar wordt uitgesloten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReroll}>Herverloten</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <div className="flex items-center gap-3 py-3 border-y border-border">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">{posterInitial}</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">{posterName}</p>
            <p className="text-xs text-muted-foreground">
              Geplaatst {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: nl })}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        <div>
          <h3 className="font-bold text-foreground mb-2">Beschrijving</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{post.description}</p>
        </div>

        {post.pickup_notes && (
          <div>
            <h3 className="font-bold text-foreground mb-2">Ophaalvoorkeur</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{post.pickup_notes}</p>
          </div>
        )}

        <CommentsSection postId={post.id} />

        <ReportDialog postId={post.id} />
      </div>

      {/* Bottom action bar — only for active/ending posts */}
      {(post.status === "active" || post.status === "ending") && (
        <div className="sticky bottom-0 px-4 py-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
          <Button
            onClick={handleLike}
            className={`w-full h-14 text-base font-bold rounded-xl transition-all ${
              post.user_has_liked ? "bg-accent hover:bg-accent/90" : ""
            }`}
            size="lg"
          >
            <Heart className={`w-5 h-5 mr-2 ${post.user_has_liked ? "fill-current" : ""}`} />
            {post.user_has_liked ? "Je doet mee! 🎉" : "Doe mee aan de loting"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PostDetail;

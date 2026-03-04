import { ArrowLeft, Heart, Share2, MapPin, Clock, MessageCircle, Flag, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/feed/StatusBadge";

const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop",
  ];

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Image carousel */}
      <div className="relative aspect-square bg-muted">
        <img
          src={images[currentImage]}
          alt="Product"
          className="w-full h-full object-cover"
        />
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {/* Share */}
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
          <Share2 className="w-5 h-5 text-foreground" />
        </button>
        {/* Image indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentImage ? "bg-card w-6" : "bg-card/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status="active" />
            <span className="text-xs text-muted-foreground font-semibold">Meubels</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">IKEA Kallax kast wit</h1>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            1,2 km
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            18 uur over
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            {likeCount} deelnemers
          </span>
        </div>

        {/* Poster info */}
        <div className="flex items-center gap-3 py-3 border-y border-border">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">L</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">Lisa M.</p>
            <p className="text-xs text-muted-foreground">Geplaatst 6 uur geleden</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Description */}
        <div>
          <h3 className="font-bold text-foreground mb-2">Beschrijving</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Goed onderhouden Kallax kast met 4 vakken. Zelf ophalen, begane grond. 
            Lichte gebruikssporen maar staat nog stevig. Afmetingen: 77x77cm.
            Graag zelf ophalen, ik kan helpen tillen als dat nodig is.
          </p>
        </div>

        {/* Questions */}
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Vragen (2)
          </h3>
          <div className="space-y-3">
            <div className="bg-secondary rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-foreground">Pieter D.</span>
                <span className="text-xs text-muted-foreground">3u geleden</span>
              </div>
              <p className="text-sm text-foreground">Past deze in een kleine auto?</p>
              <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-primary">Lisa M.</span>
                  <span className="text-xs text-muted-foreground">2u geleden</span>
                </div>
                <p className="text-sm text-foreground">Ja, als je de achterbank neerklapt past het!</p>
              </div>
            </div>
            <div className="bg-secondary rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-foreground">Anja V.</span>
                <span className="text-xs text-muted-foreground">1u geleden</span>
              </div>
              <p className="text-sm text-foreground">Welke kleur is het precies?</p>
            </div>
          </div>
          <button className="w-full mt-3 h-12 rounded-xl border border-border text-sm font-semibold text-foreground bg-card">
            Stel een vraag...
          </button>
        </div>

        {/* Report */}
        <button className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Flag className="w-4 h-4" />
          Meld dit product
        </button>
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 px-4 py-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
        <Button
          onClick={handleLike}
          className={`w-full h-14 text-base font-bold rounded-xl transition-all ${
            liked ? "bg-accent hover:bg-accent/90" : ""
          }`}
          size="lg"
        >
          <Heart className={`w-5 h-5 mr-2 ${liked ? "fill-current" : ""}`} />
          {liked ? "Je doet mee! 🎉" : "Doe mee aan de loting"}
        </Button>
      </div>
    </div>
  );
};

export default PostDetail;

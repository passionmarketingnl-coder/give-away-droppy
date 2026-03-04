import { useState } from "react";
import { ArrowLeft, Camera, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const categories = ["Meubels", "Kinderen", "Keuken", "Elektronica", "Boeken", "Tuin", "Sport", "Kleding", "Overig"];

const CreatePost = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  const addMockImage = () => {
    const mockImages = [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop",
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200&h=200&fit=crop",
    ];
    if (images.length < 5) {
      setImages([...images, mockImages[images.length % mockImages.length]]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 h-14 flex items-center border-b border-border">
        <button onClick={() => navigate(-1)} className="mr-3 tap-highlight-none">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-extrabold text-foreground">Iets weggeven</h1>
      </header>

      <div className="px-4 py-5 space-y-6">
        {/* Photos */}
        <div>
          <label className="text-sm font-bold text-foreground mb-3 block">
            Foto's <span className="text-muted-foreground font-normal">(max 5)</span>
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-background" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                onClick={addMockImage}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 flex-shrink-0 tap-highlight-none"
              >
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold">
                  {images.length === 0 ? "Voeg toe" : <Plus className="w-4 h-4" />}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-bold text-foreground mb-2 block">Titel</label>
          <Input
            placeholder="Bijv. IKEA Kallax kast"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 text-base rounded-xl"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-bold text-foreground mb-2 block">Beschrijving</label>
          <Textarea
            placeholder="Vertel iets over het product, de staat en eventuele gebreken..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] text-base rounded-xl resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-bold text-foreground mb-3 block">Categorie</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all tap-highlight-none ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Pickup notes */}
        <div>
          <label className="text-sm font-bold text-foreground mb-2 block">
            Ophaalvoorkeur <span className="text-muted-foreground font-normal">(optioneel)</span>
          </label>
          <Input
            placeholder="Bijv. voordeur begane grond, na 17:00"
            value={pickupNotes}
            onChange={(e) => setPickupNotes(e.target.value)}
            className="h-12 text-base rounded-xl"
          />
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl bg-droppy-teal-light">
          <p className="text-sm text-foreground leading-relaxed">
            📍 Je product wordt zichtbaar voor buren binnen <strong>12 km</strong>.
            <br />
            ⏱️ Na 24 uur of bij 100 likes wordt automatisch een winnaar geloot.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 px-4 py-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
        <Button
          className="w-full h-14 text-base font-bold rounded-xl"
          size="lg"
          disabled={!title || !description || !category || images.length === 0}
        >
          Publiceer gratis
        </Button>
      </div>
    </div>
  );
};

export default CreatePost;

import { useState, useRef } from "react";
import { ArrowLeft, Camera, X, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/usePosts";
import { useToast } from "@/hooks/use-toast";

const categories = ["Meubels", "Kinderen", "Keuken", "Elektronica", "Boeken", "Tuin", "Sport", "Kleding", "Overig"];

const CreatePost = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createPost = useCreatePost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - imageFiles.length;
    const newFiles = files.slice(0, remaining);

    setImageFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await createPost.mutateAsync({
        title,
        description,
        category,
        pickup_notes: pickupNotes,
        imageFiles,
      });
      toast({ title: "Geplaatst! 🎉", description: "Je weggeefactie is live." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 h-14 flex items-center border-b border-border">
        <button onClick={() => navigate(-1)} className="mr-3 tap-highlight-none">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-extrabold text-foreground">Iets weggeven</h1>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="px-4 py-5 space-y-6">
        <div>
          <label className="text-sm font-bold text-foreground mb-3 block">
            Foto's <span className="text-muted-foreground font-normal">(max 5)</span>
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {imagePreviews.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-background" />
                </button>
              </div>
            ))}
            {imageFiles.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 flex-shrink-0 tap-highlight-none"
              >
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold">
                  {imageFiles.length === 0 ? "Voeg toe" : <Plus className="w-4 h-4" />}
                </span>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-foreground mb-2 block">Titel</label>
          <Input
            placeholder="Bijv. IKEA Kallax kast"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 text-base rounded-xl"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-foreground mb-2 block">Beschrijving</label>
          <Textarea
            placeholder="Vertel iets over het product, de staat en eventuele gebreken..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] text-base rounded-xl resize-none"
          />
        </div>

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

        <div className="p-4 rounded-xl bg-primary/5">
          <p className="text-sm text-foreground leading-relaxed">
            📍 Je product wordt zichtbaar voor buren binnen <strong>7 km</strong>.
            <br />
            ⏱️ Na 24 uur of bij 100 likes wordt automatisch een winnaar geloot.
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 px-4 py-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
        <Button
          onClick={handleSubmit}
          className="w-full h-14 text-base font-bold rounded-xl"
          size="lg"
          disabled={!title || !description || !category || imageFiles.length === 0 || createPost.isPending}
        >
          {createPost.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publiceer gratis"}
        </Button>
      </div>
    </div>
  );
};

export default CreatePost;

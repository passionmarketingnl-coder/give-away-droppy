import { useState, useRef } from "react";
import { ArrowLeft, Camera, Loader2, MapPin, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize form with profile data once loaded
  if (profile && !initialized) {
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setPostcode(profile.postcode || "");
    setHouseNumber(profile.house_number || "");
    setAvatarPreview(profile.avatar_url);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Niet ingelogd");

      let avatarUrl = profile?.avatar_url || null;

      // Upload avatar if changed
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(path);

        avatarUrl = urlData.publicUrl;
      }

      const cleanPostcode = postcode.toUpperCase().replace(/\s/g, "");

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          postcode: cleanPostcode,
          house_number: houseNumber,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Re-geocode if address changed
      if (cleanPostcode !== (profile?.postcode || "") || houseNumber !== (profile?.house_number || "")) {
        try {
          await supabase.functions.invoke("geocode-address", {
            body: { postcode: cleanPostcode, house_number: houseNumber },
          });
        } catch (e) {
          console.warn("Geocoding failed", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      toast.success("Profiel bijgewerkt!");
      navigate("/profile");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = firstName
    ? `${firstName.charAt(0)}${(lastName || "").charAt(0)}`
    : "?";

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/profile")} className="tap-highlight-none">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-extrabold text-foreground">Profiel bewerken</h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-extrabold text-3xl">{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-primary font-semibold"
          >
            Foto wijzigen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Voornaam</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-14 text-base rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Achternaam</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-14 text-base rounded-xl"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-bold text-foreground mb-1.5 block">Postcode</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="w-28">
              <label className="text-sm font-bold text-foreground mb-1.5 block">Huisnr.</label>
              <div className="relative">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          className="w-full h-14 text-base font-bold rounded-xl"
          disabled={!firstName || !lastName || saveMutation.isPending}
        >
          {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Opslaan"}
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;

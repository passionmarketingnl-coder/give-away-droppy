import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  pickup_notes: string | null;
  created_at: string;
  raffle_due_at: string | null;
  user_id: string;
  images: { id: string; image_url: string; sort_order: number }[];
  like_count: number;
  user_has_liked: boolean;
  poster: { first_name: string; last_name: string; avatar_url: string | null } | null;
  display_location: string | null;
  distance_km: number | null;
}

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_KM = 7;

export const usePosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["posts"],
    queryFn: async (): Promise<Post[]> => {
      // Get current user's coordinates
      let userLat: number | null = null;
      let userLng: number | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("latitude, longitude")
          .eq("id", user.id)
          .single();
        userLat = profile?.latitude ?? null;
        userLng = profile?.longitude ?? null;
      }

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*, post_images(*), profiles(first_name, last_name, avatar_url)")
        .in("status", ["active", "ending"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get like counts and user likes
      const postIds = (posts || []).map((p) => p.id);

      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id, user_id")
        .in("post_id", postIds.length > 0 ? postIds : ["none"])
        .eq("is_valid", true);

      const likeCounts: Record<string, number> = {};
      const userLikes: Record<string, boolean> = {};
      (likes || []).forEach((l) => {
        likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
        if (l.user_id === user?.id) userLikes[l.post_id] = true;
      });

      const allPosts = (posts || []).map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        status: p.status,
        pickup_notes: p.pickup_notes,
        created_at: p.created_at,
        raffle_due_at: p.raffle_due_at,
        user_id: p.user_id,
        images: (p.post_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        like_count: likeCounts[p.id] || 0,
        user_has_liked: !!userLikes[p.id],
        poster: p.profiles as any,
      }));

      // Filter by 7km radius if user has coordinates
      if (userLat != null && userLng != null) {
        return allPosts.filter((post) => {
          // Show user's own posts regardless of distance
          if (post.user_id === user?.id) return true;
          // Posts without coordinates are hidden (legacy data)
          const postLat = (posts || []).find((pp) => pp.id === post.id)?.latitude;
          const postLng = (posts || []).find((pp) => pp.id === post.id)?.longitude;
          if (postLat == null || postLng == null) return true; // Show posts without coords for now
          return haversineKm(userLat, userLng, postLat, postLng) <= RADIUS_KM;
        });
      }

      return allPosts;
    },
  });
};

export const usePost = (id: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["post", id],
    queryFn: async (): Promise<Post | null> => {
      const { data: p, error } = await supabase
        .from("posts")
        .select("*, post_images(*), profiles(first_name, last_name, avatar_url)")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!p) return null;

      const { data: likes } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", id)
        .eq("is_valid", true);

      const likeCount = likes?.length || 0;
      const userLiked = likes?.some((l) => l.user_id === user?.id) || false;

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        status: p.status,
        pickup_notes: p.pickup_notes,
        created_at: p.created_at,
        raffle_due_at: p.raffle_due_at,
        user_id: p.user_id,
        images: (p.post_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        like_count: likeCount,
        user_has_liked: userLiked,
        poster: p.profiles as any,
      };
    },
    enabled: !!id,
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      category: string;
      pickup_notes: string;
      imageFiles: File[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Get user profile for coordinates
      const { data: profile } = await supabase
        .from("profiles")
        .select("latitude, longitude")
        .eq("id", user.id)
        .single();

      // Create post with user's coordinates
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          title: input.title,
          description: input.description,
          category: input.category,
          pickup_notes: input.pickup_notes || null,
          user_id: user.id,
          raffle_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          latitude: profile?.latitude || null,
          longitude: profile?.longitude || null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload images
      for (let i = 0; i < input.imageFiles.length; i++) {
        const file = input.imageFiles[i];
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${post.id}/${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);

        await supabase.from("post_images").insert({
          post_id: post.id,
          image_url: urlData.publicUrl,
          sort_order: i,
        });
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

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

      // Use secure RPC that masks sensitive fields and computes distance server-side
      const { data: posts, error } = await supabase.rpc("get_feed_posts", {
        p_user_lat: userLat,
        p_user_lng: userLng,
        p_radius_km: 7,
      });

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Fetch images for all posts
      const postIds = posts.map((p: any) => p.id);
      const { data: allImages } = await supabase
        .from("post_images")
        .select("*")
        .in("post_id", postIds)
        .order("sort_order", { ascending: true });

      const imageMap: Record<string, any[]> = {};
      (allImages || []).forEach((img: any) => {
        if (!imageMap[img.post_id]) imageMap[img.post_id] = [];
        imageMap[img.post_id].push(img);
      });

      // Get like counts and user likes
      const likeCounts: Record<string, number> = {};
      const userLikes: Record<string, boolean> = {};
      if (postIds.length > 0) {
        const { data: likesInfo } = await supabase.rpc("get_post_likes_info", { p_post_ids: postIds });
        (likesInfo || []).forEach((l: any) => {
          likeCounts[l.post_id] = Number(l.like_count) || 0;
          if (l.user_liked) userLikes[l.post_id] = true;
        });
      }

      // Fetch poster profiles via RPC
      const posterIds = [...new Set(posts.map((p: any) => p.user_id))];
      const { data: posterProfiles } = posterIds.length > 0
        ? await supabase.rpc("get_public_profiles", { user_ids: posterIds })
        : { data: [] };
      const posterMap = Object.fromEntries(
        (posterProfiles || []).map((p: any) => [p.id, p])
      );

      return posts.map((p: any) => {
        const poster = posterMap[p.user_id];
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
          images: imageMap[p.id] || [],
          like_count: likeCounts[p.id] || 0,
          user_has_liked: !!userLikes[p.id],
          poster: poster ? { first_name: poster.first_name, last_name: poster.last_name, avatar_url: poster.avatar_url } : null,
          display_location: p.display_location || null,
          distance_km: p.distance_km ?? null,
        };
      });
    },
  });
};

export const usePost = (id: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["post", id],
    queryFn: async (): Promise<Post | null> => {
      // Use secure RPC that masks sensitive fields
      const { data: posts, error } = await supabase.rpc("get_post_detail", { p_post_id: id });

      if (error) throw error;
      const p = posts?.[0];
      if (!p) return null;

      // Fetch images, likes, and poster in parallel
      const [{ data: images }, { data: likesInfo }, { data: posterProfiles }] = await Promise.all([
        supabase.from("post_images").select("*").eq("post_id", id).order("sort_order", { ascending: true }),
        supabase.rpc("get_post_likes_info", { p_post_ids: [id] }),
        supabase.rpc("get_public_profiles", { user_ids: [p.user_id] }),
      ]);

      const likeData = likesInfo?.[0];
      const likeCount = Number(likeData?.like_count) || 0;
      const userLiked = likeData?.user_liked || false;
      const poster = posterProfiles?.[0] || null;

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
        images: (images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        like_count: likeCount,
        user_has_liked: userLiked,
        poster: poster ? { first_name: poster.first_name, last_name: poster.last_name, avatar_url: poster.avatar_url } : null,
        display_location: p.display_location || null,
        distance_km: null,
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

      // Get user profile for coordinates and location
      const { data: profile } = await supabase
        .from("profiles")
        .select("latitude, longitude, display_location")
        .eq("id", user.id)
        .single();

      // Create post with user's coordinates and location
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
          display_location: profile?.display_location || null,
        } as any)
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

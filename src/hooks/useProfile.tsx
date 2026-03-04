import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useMyPosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, post_images(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p) => ({
        ...p,
        images: (p.post_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
    },
    enabled: !!user,
  });
};

export const useWonPosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["won-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, post_images(*)")
        .eq("winner_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p) => ({
        ...p,
        images: (p.post_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
    },
    enabled: !!user,
  });
};

export const useLikedPosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["liked-posts"],
    queryFn: async () => {
      // Get all post IDs the user has liked
      const { data: likes, error: likesError } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user!.id)
        .eq("is_valid", true);
      if (likesError) throw likesError;

      const postIds = (likes || []).map((l) => l.post_id);
      if (postIds.length === 0) return [];

      const { data, error } = await supabase
        .from("posts")
        .select("*, post_images(*)")
        .in("id", postIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data || []).map((p) => ({
        ...p,
        images: (p.post_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
    },
    enabled: !!user,
  });
};

export const useUnreadNotificationCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Comment {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  user_name: string;
  user_initial: string;
}

export const useComments = (postId: string) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase.rpc("get_public_profiles", { user_ids: userIds });

      const profileMap = Object.fromEntries(
        (profiles || []).map((p: any) => [p.id, p])
      );

      return data.map((c) => {
        const profile = profileMap[c.user_id];
        return {
          ...c,
          user_name: profile ? `${profile.first_name} ${profile.last_name.charAt(0)}.` : "Onbekend",
          user_initial: profile ? profile.first_name.charAt(0).toUpperCase() : "?",
        };
      });
    },
    enabled: !!postId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, body, parentId }: { postId: string; body: string; parentId?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        body,
        parent_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
};

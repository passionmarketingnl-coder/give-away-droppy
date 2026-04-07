import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useConfirmPickup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Update post status to picked_up
      const { error } = await supabase
        .from("posts")
        .update({ status: "picked_up" as any })
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update conversation status
      await supabase
        .from("conversations")
        .update({ status: "completed" as any })
        .eq("post_id", postId)
        .eq("poster_user_id", user.id);

      // Get post info for notification
      const { data: post } = await supabase
        .from("posts")
        .select("title, winner_user_id")
        .eq("id", postId)
        .single();

      // Notify winner that pickup is confirmed
      if (post?.winner_user_id) {
        await supabase.from("notifications").insert({
          user_id: post.winner_user_id,
          type: "raffle_completed" as any,
          title: "Ophaling bevestigd ✅",
          body: `"${post.title}" is succesvol opgehaald. Bedankt!`,
          post_id: postId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useReroll = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const res = await fetch(`${supabaseUrl}/functions/v1/reroll-raffle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({ post_id: postId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Herverloting mislukt");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

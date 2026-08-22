import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export const useConfirmPickup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("confirm-pickup", {
        body: { post_id: postId },
      });
      if (error) throw new Error(error.message || "Bevestiging mislukt");
      return data;
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

      const { data, error } = await supabase.functions.invoke("reroll-raffle", {
        body: { post_id: postId },
      });
      if (error) throw new Error(error.message || "Herverloting mislukt");
      // Server geeft 200 + result-veld terug zodat de echte reden zichtbaar
      // is (bij non-2xx geeft supabase-js alleen een generieke melding).
      if (data?.result === "too_early") {
        throw new Error(data.message || "Herverloten kan nog niet.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

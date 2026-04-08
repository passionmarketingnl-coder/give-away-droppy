import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface Conversation {
  id: string;
  post_id: string;
  poster_user_id: string;
  winner_user_id: string;
  status: string;
  updated_at: string;
  post_title: string;
  other_user_name: string;
  other_user_initial: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversations-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user) return [];

      const { data: convos, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`poster_user_id.eq.${user.id},winner_user_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!convos || convos.length === 0) return [];

      // Get post titles
      const postIds = [...new Set(convos.map((c) => c.post_id))];
      const { data: posts } = await supabase
        .from("posts")
        .select("id, title")
        .in("id", postIds);
      const postMap = Object.fromEntries((posts || []).map((p) => [p.id, p.title]));

      // Get other user profiles
      const otherUserIds = [...new Set(convos.map((c) =>
        c.poster_user_id === user.id ? c.winner_user_id : c.poster_user_id
      ))];
      const { data: profiles } = await supabase.rpc("get_public_profiles", { user_ids: otherUserIds });
      const profileMap = Object.fromEntries(
        (profiles || []).map((p: any) => [p.id, p])
      );

      // Get last message per conversation
      const convoIds = convos.map((c) => c.id);
      const { data: messages } = await supabase
        .from("messages")
        .select("conversation_id, body, created_at, sender_user_id")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false });

      const lastMsgMap: Record<string, { body: string; created_at: string }> = {};
      (messages || []).forEach((m) => {
        if (!lastMsgMap[m.conversation_id]) {
          lastMsgMap[m.conversation_id] = { body: m.body, created_at: m.created_at };
        }
      });

      return convos.map((c) => {
        const otherUserId = c.poster_user_id === user.id ? c.winner_user_id : c.poster_user_id;
        const profile = profileMap[otherUserId];
        const name = profile ? `${profile.first_name} ${profile.last_name.charAt(0)}.` : "Onbekend";
        const initial = profile ? profile.first_name.charAt(0).toUpperCase() : "?";

        return {
          id: c.id,
          post_id: c.post_id,
          poster_user_id: c.poster_user_id,
          winner_user_id: c.winner_user_id,
          status: c.status,
          updated_at: c.updated_at,
          post_title: postMap[c.post_id] || "Onbekend item",
          other_user_name: name,
          other_user_initial: initial,
          last_message: lastMsgMap[c.id]?.body || null,
          last_message_time: lastMsgMap[c.id]?.created_at || c.created_at,
          unread_count: 0,
        };
      });
    },
    enabled: !!user,
  });
};

export const useMessages = (conversationId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_user_id: user.id,
        body,
      });
      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

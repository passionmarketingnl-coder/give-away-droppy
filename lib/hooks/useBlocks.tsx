import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

/**
 * Blokkeer-functionaliteit (App Store 1.2 UGC-vereiste). De lijst met
 * geblokkeerde user-ids wordt client-side gebruikt om feed, comments en
 * chats te filteren.
 */
export const useBlockedIds = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked'],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_user_id');
      if (error) throw error;
      return (data || []).map((r: any) => r.blocked_user_id);
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('blocked_users').insert({
        blocker_user_id: user.id,
        blocked_user_id: blockedUserId,
      });
      // 23505 = al geblokkeerd; geen fout voor de gebruiker.
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

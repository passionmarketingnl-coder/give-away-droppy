import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

/**
 * P1 locatie-vangnet: bij registratie mét e-mailverificatie is er geen
 * sessie op het moment van signup, dus wordt geocode-address daar nooit
 * aangeroepen. Deze hook draait éénmalig per sessie zodra de user is
 * ingelogd: heeft het profiel nog geen coördinaten maar staat er wel een
 * postcode in de user metadata, dan geocoderen we alsnog en verversen we
 * de feed (die filtert op 7km rond deze coördinaten).
 */
export function useEnsureLocation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const triedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user || triedForUser.current === user.id) return;
    triedForUser.current = user.id;

    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();

      if (profile?.latitude != null && profile?.longitude != null) return;

      const meta = (user.user_metadata ?? {}) as {
        postcode?: string;
        house_number?: string;
      };
      if (!meta.postcode) return;

      try {
        const { error } = await supabase.functions.invoke('geocode-address', {
          body: { postcode: meta.postcode, house_number: meta.house_number },
        });
        if (!error) {
          // Feed opnieuw ophalen zodat de 7km-filter en afstanden nu wel werken.
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      } catch (e) {
        // Stil falen: volgende app-start probeert het opnieuw.
        console.warn('Geocode fallback mislukt, probeer later opnieuw', e);
      }
    })();
  }, [user, queryClient]);
}

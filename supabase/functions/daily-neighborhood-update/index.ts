import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const providedSecret = req.headers.get("X-Cron-Secret");
    if (!providedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: secretRow } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "cron_secret")
      .single();

    if (!secretRow || secretRow.value !== providedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // === Gespreid versturen in avond-slots ===
    // De cron vuurt elke 15 min tussen 16:00-18:45 UTC (18:00-20:45 NL in
    // de zomer). Elke gebruiker hangt via een hash van z'n id vast aan één
    // van de 12 slots, zodat niet iedereen tegelijk een push krijgt en
    // ieder dagelijks rond hetzelfde eigen moment de update ontvangt.
    const SLOT_COUNT = 12;
    const WINDOW_START_UTC_MIN = 16 * 60; // 16:00 UTC
    const minutesUtc = now.getUTCHours() * 60 + now.getUTCMinutes();
    const currentSlot = Math.floor((minutesUtc - WINDOW_START_UTC_MIN) / 15);

    let body: { slot?: number; force?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // lege body is prima (cron stuurt {})
    }

    // Handmatige override voor testen: {slot: n} of {force: true} (= alle slots).
    const activeSlot = body.slot ?? currentSlot;
    const allSlots = body.force === true;

    if (!allSlots && (activeSlot < 0 || activeSlot >= SLOT_COUNT)) {
      return new Response(
        JSON.stringify({ message: "Outside send window, nothing to do", slot: activeSlot }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deterministische slot-toewijzing per gebruiker.
    function slotForUserId(id: string): number {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
      }
      return hash % SLOT_COUNT;
    }

    // Get all posts created today that are active
    const { data: todayPosts, error: postsError } = await supabase
      .from("posts")
      .select("id, latitude, longitude")
      .gte("created_at", todayStart.toISOString())
      .in("status", ["active", "ending"]);

    if (postsError) throw postsError;
    if (!todayPosts || todayPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new posts today, no notifications sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all users with location data
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, latitude, longitude")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (profilesError) throw profilesError;

    // Helper: Haversine distance in km
    function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    let notificationCount = 0;

    for (const profile of profiles || []) {
      if (!profile.latitude || !profile.longitude) continue;

      // Alleen gebruikers van het huidige kwartier-slot (tenzij force).
      if (!allSlots && slotForUserId(profile.id) !== activeSlot) continue;

      // Max één daily_update per gebruiker per dag.
      const { count: existingCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("type", "daily_update")
        .gte("created_at", todayStart.toISOString());

      if ((existingCount || 0) > 0) continue;

      // Count posts within 7km
      const nearbyCount = todayPosts.filter((post) => {
        if (!post.latitude || !post.longitude) return false;
        return haversineKm(profile.latitude!, profile.longitude!, post.latitude, post.longitude) <= 7;
      }).length;

      if (nearbyCount === 0) continue;

      await supabase.from("notifications").insert({
        user_id: profile.id,
        type: "daily_update",
        title: "Nieuw in jouw buurt 🏘️",
        body: `${nearbyCount} nieuwe item${nearbyCount === 1 ? "" : "s"} vandaag in jouw buurt — kom kijken!`,
        post_id: null,
      });

      notificationCount++;
    }

    return new Response(
      JSON.stringify({ sent: notificationCount, slot: allSlots ? "all" : activeSlot }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

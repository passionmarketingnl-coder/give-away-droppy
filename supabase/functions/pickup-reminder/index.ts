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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();

    // Find posts that were raffled ~24h ago and not yet picked up
    // We check a 1-hour window to avoid re-sending on every cron run
    const { data: rafflesToRemind, error } = await supabase
      .from("raffles")
      .select("id, post_id, winner_user_id")
      .gte("created_at", twentyFiveHoursAgo)
      .lte("created_at", twentyFourHoursAgo)
      .not("winner_user_id", "is", null);

    if (error) throw error;

    let sent = 0;

    for (const raffle of rafflesToRemind || []) {
      // Check if post is still in "raffled" status (not yet picked_up)
      const { data: post } = await supabase
        .from("posts")
        .select("id, title, user_id, status, winner_user_id")
        .eq("id", raffle.post_id)
        .single();

      if (!post || post.status !== "raffled") continue;

      // Check if we already sent a pickup_confirm for this post
      const { count: existingCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("type", "pickup_confirm")
        .eq("post_id", post.id);

      if ((existingCount || 0) > 0) continue;

      // Get winner name for the poster notification
      const { data: winnerProfile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", raffle.winner_user_id!)
        .single();

      const winnerName = winnerProfile?.first_name || "De winnaar";

      // Notify winner
      await supabase.from("notifications").insert({
        user_id: raffle.winner_user_id!,
        type: "pickup_confirm",
        title: `Heb je ${post.title} opgehaald? ✅`,
        body: "Bevestig de ophaling zodat de aanbieder weet dat alles goed is verlopen.",
        post_id: post.id,
      });

      // Notify poster
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "pickup_confirm",
        title: `Is ${post.title} opgehaald? ✅`,
        body: `Bevestig de ophaling als ${winnerName} het product heeft opgehaald.`,
        post_id: post.id,
      });

      sent += 2;
    }

    return new Response(
      JSON.stringify({ sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

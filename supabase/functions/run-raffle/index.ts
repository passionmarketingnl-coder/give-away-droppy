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
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

    // === STEP 1: Check posts with 100+ likes that are at least 4 hours old ===
    // These get raffled early (before the 24h timer)
    const { data: allActivePosts } = await supabase
      .from("posts")
      .select("id, user_id, title, created_at")
      .in("status", ["active", "ending"])
      .lte("created_at", fourHoursAgo);

    for (const post of allActivePosts || []) {
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id)
        .eq("is_valid", true);

      if ((count || 0) >= 100) {
        // Mark as ending so it gets picked up for raffle below
        await supabase
          .from("posts")
          .update({ status: "ending", raffle_due_at: now.toISOString() })
          .eq("id", post.id)
          .eq("status", "active");
      }
    }

    // === STEP 2: Raffle all posts where raffle_due_at <= now AND created >= 4h ago ===
    const { data: duePosts, error: fetchError } = await supabase
      .from("posts")
      .select("id, user_id, title, created_at")
      .in("status", ["active", "ending"])
      .lte("raffle_due_at", now.toISOString())
      .lte("created_at", fourHoursAgo);

    if (fetchError) throw fetchError;

    const results = [];

    for (const post of duePosts || []) {
      const { data: likes, error: likesError } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", post.id)
        .eq("is_valid", true);

      if (likesError) throw likesError;

      const participants = (likes || []).filter(
        (l) => l.user_id !== post.user_id
      );

      if (participants.length === 0) {
        await supabase
          .from("posts")
          .update({ status: "removed" })
          .eq("id", post.id);
        results.push({ post_id: post.id, result: "no_participants" });
        continue;
      }

      const winner =
        participants[Math.floor(Math.random() * participants.length)];

      const triggerReason =
        participants.length >= 100 ? "likes_threshold" : "timer";

      await supabase
        .from("posts")
        .update({ status: "raffled", winner_user_id: winner.user_id })
        .eq("id", post.id);

      await supabase.from("raffles").insert({
        post_id: post.id,
        winner_user_id: winner.user_id,
        participant_count: participants.length,
        trigger_reason: triggerReason,
      });

      const { data: convo } = await supabase.from("conversations").insert({
        post_id: post.id,
        poster_user_id: post.user_id,
        winner_user_id: winner.user_id,
      }).select("id").single();

      // Auto welcome message from poster
      if (convo) {
        await supabase.from("messages").insert({
          conversation_id: convo.id,
          sender_user_id: post.user_id,
          body: `Gefeliciteerd! 🎉 Je hebt "${post.title}" gewonnen. Wanneer kun je het ophalen?`,
        });
      }

      // Notify winner (notification 6)
      await supabase.from("notifications").insert({
        user_id: winner.user_id,
        type: "raffle_won",
        title: "Gefeliciteerd, jij wint! 🎉",
        body: `Jij wint ${post.title}! Neem contact op met de aanbieder om de ophaling te regelen.`,
        post_id: post.id,
      });

      // Notify poster
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "raffle_completed",
        title: "Loting afgerond 🎲",
        body: `De loting van ${post.title} is afgerond!`,
        post_id: post.id,
      });

      // Notify all other participants (notification 5)
      const otherParticipants = participants.filter(
        (p) => p.user_id !== winner.user_id
      );
      if (otherParticipants.length > 0) {
        const participantNotifications = otherParticipants.map((p) => ({
          user_id: p.user_id,
          type: "raffle_completed" as const,
          title: "Loting afgerond 🎲",
          body: `De loting van ${post.title} is afgerond!`,
          post_id: post.id,
        }));
        await supabase.from("notifications").insert(participantNotifications);
      }

      results.push({
        post_id: post.id,
        winner: winner.user_id,
        participants: participants.length,
        trigger: triggerReason,
      });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

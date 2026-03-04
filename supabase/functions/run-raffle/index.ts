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

    // Find posts that are due for raffle (raffle_due_at <= now AND status is active/ending)
    // Posts must have been live for at least 4 hours before they can be raffled
    const { data: duePosts, error: fetchError } = await supabase
      .from("posts")
      .select("id, user_id, title, created_at")
      .in("status", ["active", "ending"])
      .lte("raffle_due_at", now.toISOString())
      .lte("created_at", fourHoursAgo);

    if (fetchError) throw fetchError;

    const results = [];

    for (const post of duePosts || []) {
      // Get valid likes for this post
      const { data: likes, error: likesError } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", post.id)
        .eq("is_valid", true);

      if (likesError) throw likesError;

      // Filter out the post owner
      const participants = (likes || []).filter(
        (l) => l.user_id !== post.user_id
      );

      if (participants.length === 0) {
        // No participants — mark as removed
        await supabase
          .from("posts")
          .update({ status: "removed" })
          .eq("id", post.id);
        results.push({ post_id: post.id, result: "no_participants" });
        continue;
      }

      // Pick random winner
      const winner =
        participants[Math.floor(Math.random() * participants.length)];

      // Update post
      await supabase
        .from("posts")
        .update({ status: "raffled", winner_user_id: winner.user_id })
        .eq("id", post.id);

      // Create raffle record
      await supabase.from("raffles").insert({
        post_id: post.id,
        winner_user_id: winner.user_id,
        participant_count: participants.length,
        trigger_reason: "timer",
      });

      // Create conversation between poster and winner
      await supabase.from("conversations").insert({
        post_id: post.id,
        poster_user_id: post.user_id,
        winner_user_id: winner.user_id,
      });

      // Notify winner
      await supabase.from("notifications").insert({
        user_id: winner.user_id,
        type: "raffle_won",
        title: "Je hebt gewonnen! 🎉",
        body: `Je hebt "${post.title}" gewonnen. Regel het ophalen via de chat.`,
        post_id: post.id,
      });

      // Notify poster
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "raffle_completed",
        title: "Loting voltooid",
        body: `De loting voor "${post.title}" is afgerond. Bekijk de winnaar in je chats.`,
        post_id: post.id,
      });

      results.push({
        post_id: post.id,
        winner: winner.user_id,
        participants: participants.length,
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

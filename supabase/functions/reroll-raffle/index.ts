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

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { post_id } = await req.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the post exists and is in raffled or reroll status
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, title, winner_user_id, status")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: "Post niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is the post owner
    if (post.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["raffled", "reroll"].includes(post.status)) {
      return new Response(
        JSON.stringify({ error: "Post kan niet herverdeeld worden" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all previous winners to exclude
    const { data: previousRaffles } = await supabase
      .from("raffles")
      .select("winner_user_id")
      .eq("post_id", post_id);

    const excludedUserIds = new Set<string>();
    excludedUserIds.add(post.user_id); // Exclude poster
    (previousRaffles || []).forEach((r) => {
      if (r.winner_user_id) excludedUserIds.add(r.winner_user_id);
    });

    // Get eligible participants
    const { data: likes } = await supabase
      .from("post_likes")
      .select("user_id")
      .eq("post_id", post_id)
      .eq("is_valid", true);

    const participants = (likes || []).filter(
      (l) => !excludedUserIds.has(l.user_id)
    );

    if (participants.length === 0) {
      // No more participants, mark as removed
      await supabase
        .from("posts")
        .update({ status: "removed" })
        .eq("id", post_id);

      // Notify poster
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        type: "raffle_completed",
        title: "Geen deelnemers meer",
        body: `Er zijn geen deelnemers meer over voor "${post.title}". De post is verwijderd.`,
        post_id: post_id,
      });

      return new Response(
        JSON.stringify({ result: "no_participants", post_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick new winner
    const winner = participants[Math.floor(Math.random() * participants.length)];

    // Get the last raffle id for reroll_of reference
    const { data: lastRaffle } = await supabase
      .from("raffles")
      .select("id")
      .eq("post_id", post_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Update post
    await supabase
      .from("posts")
      .update({ status: "raffled", winner_user_id: winner.user_id })
      .eq("id", post_id);

    // Create raffle record
    await supabase.from("raffles").insert({
      post_id: post_id,
      winner_user_id: winner.user_id,
      participant_count: participants.length,
      trigger_reason: "reroll",
      reroll_of_raffle_id: lastRaffle?.id || null,
    });

    // Create new conversation
    const { data: convo } = await supabase.from("conversations").insert({
      post_id: post_id,
      poster_user_id: post.user_id,
      winner_user_id: winner.user_id,
    }).select("id").single();

    // Auto welcome message from poster
    if (convo) {
      await supabase.from("messages").insert({
        conversation_id: convo.id,
        sender_user_id: post.user_id,
        body: `Gefeliciteerd! 🎉 Je hebt "${post.title}" gewonnen via een herverloting. Wanneer kun je het ophalen?`,
      });
    }

    // Notify new winner
    await supabase.from("notifications").insert({
      user_id: winner.user_id,
      type: "raffle_won",
      title: "Je hebt gewonnen! 🎉",
      body: `Je hebt "${post.title}" gewonnen via een herverloting. Regel het ophalen via de chat.`,
      post_id: post_id,
    });

    // Notify poster
    await supabase.from("notifications").insert({
      user_id: post.user_id,
      type: "reroll",
      title: "Nieuwe winnaar gekozen",
      body: `Er is een nieuwe winnaar gekozen voor "${post.title}". Bekijk de chat.`,
      post_id: post_id,
    });

    return new Response(
      JSON.stringify({
        result: "rerolled",
        post_id,
        winner: winner.user_id,
        remaining_participants: participants.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

    // Verify the post exists, belongs to this user, and is in raffled state
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, title, winner_user_id, status")
      .eq("id", post_id)
      .eq("user_id", user.id)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: "Post niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (post.status !== "raffled") {
      return new Response(
        JSON.stringify({ error: "Post kan niet als opgehaald gemarkeerd worden" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update post status to picked_up (using service_role bypasses the trigger)
    const { error: updateError } = await supabase
      .from("posts")
      .update({ status: "picked_up" })
      .eq("id", post_id);

    if (updateError) throw updateError;

    // Update conversation status
    await supabase
      .from("conversations")
      .update({ status: "completed" })
      .eq("post_id", post_id)
      .eq("poster_user_id", user.id);

    // Notify winner that pickup is confirmed
    if (post.winner_user_id) {
      await supabase.from("notifications").insert({
        user_id: post.winner_user_id,
        type: "raffle_completed",
        title: "Ophaling bevestigd ✅",
        body: `"${post.title}" is succesvol opgehaald. Bedankt!`,
        post_id: post_id,
      });
    }

    return new Response(
      JSON.stringify({ result: "confirmed", post_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

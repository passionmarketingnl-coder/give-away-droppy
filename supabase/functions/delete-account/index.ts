import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Verwijdert het account van de aanroepende gebruiker volledig.
// Store-vereiste: Apple 5.1.1(v) en Google's account deletion policy
// verplichten in-app accountverwijdering. AVG: alle data gaat mee.
//
// - Storage: alle bestanden onder {user_id}/ in post-images (postfoto's
//   en avatar)
// - Database: auth.admin.deleteUser → alle tabellen cascaden via
//   ON DELETE CASCADE (profiles, posts, likes, comments, conversations,
//   messages, notifications, reports, consents, push tokens)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1) Storage opruimen: {user_id}/ bevat losse bestanden (avatar) en
    //    post-mappen ({post_id}/0.jpg). Twee niveaus diep is voldoende.
    const bucket = admin.storage.from("post-images");
    const toDelete: string[] = [];

    const { data: rootEntries } = await bucket.list(user.id, { limit: 1000 });
    for (const entry of rootEntries || []) {
      if (entry.id) {
        // Bestand op root-niveau (bijv. avatar)
        toDelete.push(`${user.id}/${entry.name}`);
      } else {
        // Submap (post) → bestanden erin verzamelen
        const { data: subEntries } = await bucket.list(
          `${user.id}/${entry.name}`,
          { limit: 1000 }
        );
        for (const sub of subEntries || []) {
          if (sub.id) toDelete.push(`${user.id}/${entry.name}/${sub.name}`);
        }
      }
    }
    if (toDelete.length > 0) {
      await bucket.remove(toDelete);
    }

    // 2) User + alle data via cascades
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ result: "deleted", files_removed: toDelete.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

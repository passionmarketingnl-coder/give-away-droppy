import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { postcode, house_number } = await req.json();
    if (!postcode) {
      return new Response(JSON.stringify({ error: "Postcode required" }), { status: 400, headers: corsHeaders });
    }

    // Use Dutch PDOK geocoding API (free, no key needed)
    const query = `${postcode} ${house_number || ""}`.trim();
    const pdokUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(query)}&rows=1&fq=type:adres`;
    
    const geoRes = await fetch(pdokUrl);
    const geoData = await geoRes.json();

    if (!geoData.response?.docs?.length) {
      return new Response(JSON.stringify({ error: "Address not found" }), { status: 404, headers: corsHeaders });
    }

    const doc = geoData.response.docs[0];
    // PDOK returns centroide_ll as "POINT(lng lat)"
    const match = doc.centroide_ll?.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Could not parse coordinates" }), { status: 500, headers: corsHeaders });
    }

    const longitude = parseFloat(match[1]);
    const latitude = parseFloat(match[2]);
    const displayLocation = doc.weergavenaam || `${postcode}`;

    // Update profile with coordinates using service role for reliability
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.from("profiles").update({
      latitude,
      longitude,
      display_location: displayLocation,
    }).eq("id", user.id);

    return new Response(JSON.stringify({ latitude, longitude, display_location: displayLocation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});

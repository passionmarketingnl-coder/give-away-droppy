import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: "default";
  priority: "high";
  channelId: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

// Zoekt de conversation_id voor een post_id om notification tap-navigatie
// (bijv. chat_message → chats/:id) mogelijk te maken.
async function findConversationForPost(
  supabase: ReturnType<typeof createClient>,
  postId: string,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("post_id", postId)
    .or(`poster_user_id.eq.${userId},winner_user_id.eq.${userId}`)
    .maybeSingle();
  return data?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { notification_id } = await req.json();
    if (!notification_id) {
      return new Response(
        JSON.stringify({ error: "notification_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Notification-rij ophalen
    const { data: notif, error: notifError } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, body, post_id")
      .eq("id", notification_id)
      .single();

    if (notifError || !notif) {
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Actieve tokens voor deze user ophalen
    const { data: tokens } = await supabase
      .from("user_push_tokens")
      .select("token, platform")
      .eq("user_id", notif.user_id);

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, reason: "no tokens for user" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Voor chat/raffle types: probeer de conversation_id te vinden zodat de tap
    // de gebruiker naar het juiste chat-scherm leidt.
    let conversation_id: string | null = null;
    if (
      notif.post_id &&
      ["chat_message", "raffle_won", "raffle_completed"].includes(notif.type)
    ) {
      conversation_id = await findConversationForPost(
        supabase,
        notif.post_id,
        notif.user_id,
      );
    }

    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title: notif.title,
      body: notif.body,
      data: {
        type: notif.type,
        post_id: notif.post_id,
        conversation_id,
        notification_id: notif.id,
      },
      sound: "default",
      priority: "high",
      channelId: "default",
    }));

    // Naar Expo Push API sturen
    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(messages),
    });

    const result = await expoRes.json();
    const tickets: ExpoPushTicket[] = result?.data ?? [];

    // Verwijder tokens waarvan Expo zegt dat ze niet meer geregistreerd zijn
    const invalidTokens: string[] = [];
    tickets.forEach((ticket, i) => {
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        invalidTokens.push(tokens[i].token);
      }
    });
    if (invalidTokens.length > 0) {
      await supabase
        .from("user_push_tokens")
        .delete()
        .in("token", invalidTokens);
    }

    return new Response(
      JSON.stringify({
        sent: tickets.filter((t) => t.status === "ok").length,
        errors: tickets.filter((t) => t.status === "error").length,
        removed_invalid: invalidTokens.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

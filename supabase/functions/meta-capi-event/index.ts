import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // ── Read secrets from Supabase environment ──────────────────────────────
    const PIXEL_ID = Deno.env.get("META_PIXEL_ID");
    const ACCESS_TOKEN = Deno.env.get("META_CAPI_ACCESS_TOKEN");
    const TEST_EVENT_CODE = Deno.env.get("META_TEST_EVENT_CODE"); // optional

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error("[CAPI] Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN");
      return new Response(
        JSON.stringify({ success: false, error: "CAPI secrets not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ── Parse incoming event payload ────────────────────────────────────────
    const payload = await req.json();

    const {
      event_name,
      event_time = Math.floor(Date.now() / 1000),
      event_source_url,
      user_data = {},
      custom_data = {},
      event_id,
    } = payload;

    if (!event_name) {
      return new Response(
        JSON.stringify({ success: false, error: "event_name is required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ── Build the event object for Meta Graph API ───────────────────────────
    const event: Record<string, unknown> = {
      event_name,
      event_time,
      action_source: "website",
      user_data: {
        ...user_data,
        // client_user_agent is important for Meta's matching
        client_user_agent: user_data.client_user_agent ?? req.headers.get("user-agent") ?? "",
        // client_ip_address — obtained from request headers server-side
        client_ip_address:
          user_data.client_ip_address ??
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          req.headers.get("x-real-ip") ??
          "",
      },
      custom_data: Object.keys(custom_data).length > 0 ? custom_data : undefined,
    };

    if (event_source_url) event.event_source_url = event_source_url;
    if (event_id) event.event_id = event_id; // Used for deduplication

    // ── Build Meta Graph API request ────────────────────────────────────────
    const metaUrl = new URL(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`
    );
    metaUrl.searchParams.set("access_token", ACCESS_TOKEN);
    if (TEST_EVENT_CODE) {
      metaUrl.searchParams.set("test_event_code", TEST_EVENT_CODE);
    }

    const body: Record<string, unknown> = { data: [event] };

    const metaRes = await fetch(metaUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.error("[CAPI] Meta API error:", JSON.stringify(metaData));
      return new Response(
        JSON.stringify({ success: false, error: metaData }),
        {
          status: metaRes.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[CAPI] ✅ Event sent: ${event_name}`, metaData);

    return new Response(
      JSON.stringify({ success: true, result: metaData }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[CAPI] Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/**
 * Meta Conversions API (CAPI) Edge Function
 *
 * Receives events from the frontend and forwards them to Meta's
 * server-side Conversions API. This ensures events reach Meta even
 * when browser ad-blockers prevent the Pixel script from firing.
 *
 * Required Supabase Secrets:
 *   META_PIXEL_ID          — Your Facebook Pixel ID
 *   META_CAPI_ACCESS_TOKEN — Generated in Meta Events Manager → Settings
 *
 * Optional Supabase Secret:
 *   META_TEST_EVENT_CODE   — For testing (e.g., "TEST12345"). Remove in production.
 */

const META_PIXEL_ID = Deno.env.get("META_PIXEL_ID");
const META_CAPI_ACCESS_TOKEN = Deno.env.get("META_CAPI_ACCESS_TOKEN");
const META_TEST_EVENT_CODE = Deno.env.get("META_TEST_EVENT_CODE"); // Optional

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

/**
 * Hash a string using SHA-256 (Meta requires hashed PII).
 * Returns lowercase hex digest, or null if input is empty.
 */
async function hashSHA256(
  value: string | null | undefined,
): Promise<string | null> {
  if (!value || value.trim() === "") return null;

  // Normalize: lowercase, trim whitespace
  const normalized = value.toLowerCase().trim();

  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // ── Handle CORS preflight ──
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  // ── Validate configuration ──
  if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) {
    console.error(
      "[Meta CAPI] Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN secrets",
    );
    return new Response(
      JSON.stringify({ error: "Meta CAPI configuration is missing" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      },
    );
  }

  try {
    const body = await req.json();

    const {
      event_name,
      event_id,
      event_source_url,
      user_data = {},
      custom_data = {},
    } = body;

    if (!event_name || !event_id) {
      return new Response(
        JSON.stringify({ error: "event_name and event_id are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }

    // ── Hash user PII (Meta requires SHA-256 hashing) ──
    const hashedPhone = await hashSHA256(user_data.ph);
    const hashedName = await hashSHA256(user_data.fn);

    // ── Build the Conversions API payload ──
    // Docs: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
    const clientIpAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      undefined;

    const eventPayload: Record<string, any> = {
      event_name,
      event_id, // Must match the Pixel's eventID for deduplication
      event_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
      action_source: "website",
      event_source_url: event_source_url || undefined,
      user_data: {
        client_user_agent:
          user_data.client_user_agent ||
          req.headers.get("user-agent") ||
          undefined,
        client_ip_address: clientIpAddress,
        fbp: user_data.fbp || undefined, // _fbp cookie (browser ID)
        fbc: user_data.fbc || undefined, // _fbc cookie (click ID from ads)
        ...(hashedPhone ? { ph: [hashedPhone] } : {}),
        ...(hashedName ? { fn: [hashedName] } : {}),
      },
    };

    // Attach custom_data if present (value, currency, content_ids, etc.)
    if (custom_data && Object.keys(custom_data).length > 0) {
      eventPayload.custom_data = custom_data;
    }

    // ── Build request body for Meta's API ──
    const requestBody: Record<string, any> = {
      data: [eventPayload],
    };

    // If a test event code is set, include it (for Events Manager debugging)
    if (META_TEST_EVENT_CODE) {
      requestBody.test_event_code = META_TEST_EVENT_CODE;
    }

    // ── Send to Meta Conversions API ──
    const metaUrl = `https://graph.facebook.com/v22.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`;

    const metaResponse = await fetch(metaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("[Meta CAPI] API error:", JSON.stringify(metaResult));
      return new Response(
        JSON.stringify({
          success: false,
          error: metaResult?.error?.message || "Meta API error",
        }),
        {
          status: metaResponse.status,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }

    console.log(
      `[Meta CAPI] ✅ ${event_name} sent — events_received: ${metaResult.events_received}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        events_received: metaResult.events_received,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      },
    );
  } catch (error) {
    console.error("[Meta CAPI] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      },
    );
  }
});

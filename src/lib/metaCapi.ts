/**
 * Meta Conversions API (CAPI) — Client-Side Helper
 *
 * Sends events to the `meta-capi-event` Supabase Edge Function,
 * which forwards them to Meta's server-side Conversions API.
 *
 * Why server-side? Browser ad-blockers can block the Pixel script,
 * but server-to-server calls always reach Meta. This ensures your
 * Purchase events are never lost.
 *
 * The `event_id` parameter is the same UUID returned by metaPixel.*()
 * so Meta can deduplicate between Pixel and CAPI.
 */

import { supabase } from './supabase';

/**
 * Read the _fbp (Facebook Browser ID) cookie.
 * Meta uses this to match browser sessions to ad clicks.
 */
function getFbp(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Read the _fbc (Facebook Click ID) cookie.
 * Set when a user arrives via a Facebook ad click (?fbclid=...).
 */
function getFbc(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Define the shape of event data we send to the edge function
interface CAPIEventPayload {
  event_name: string;
  event_id: string;
  event_source_url: string;
  user_data: {
    client_user_agent: string;
    fbp?: string | null;
    fbc?: string | null;
    ph?: string | null;    // Hashed phone (SHA-256 done server-side)
    fn?: string | null;    // Hashed first name (SHA-256 done server-side)
  };
  custom_data?: Record<string, any>;
}

/**
 * Send a server-side event to Meta Conversions API via our edge function.
 *
 * This is fire-and-forget — it never blocks the user flow.
 * If it fails, we log it silently without affecting UX.
 *
 * @param eventName  Standard Meta event name (e.g., 'Purchase', 'ViewContent')
 * @param eventId    The same UUID used for the client-side Pixel event
 * @param customData Optional event-specific data (value, currency, content_ids, etc.)
 * @param userData   Optional user identifiers (phone, name — will be hashed server-side)
 */
export async function sendServerEvent(
  eventName: string,
  eventId: string,
  customData?: Record<string, any>,
  userData?: { phone?: string; fullName?: string }
): Promise<void> {
  try {
    // Build the Supabase Edge Function URL
    const supabaseUrl = (supabase as any).supabaseUrl;
    if (!supabaseUrl) {
      console.warn('[Meta CAPI] Supabase URL not available');
      return;
    }

    const functionUrl = `${supabaseUrl}/functions/v1/meta-capi-event`;

    const normalizedCustomData = customData ? { ...customData } : undefined;

    if (normalizedCustomData?.value !== undefined && normalizedCustomData?.value !== null) {
      const numericValue = Number(normalizedCustomData.value);
      normalizedCustomData.value = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
    }

    const payload: CAPIEventPayload = {
      event_name: eventName,
      event_id: eventId,
      event_source_url: window.location.href,
      user_data: {
        client_user_agent: navigator.userAgent,
        fbp: getFbp(),
        fbc: getFbc(),
        ph: userData?.phone || null,
        fn: userData?.fullName || null,
      },
      custom_data: normalizedCustomData,
    };

    // Fire-and-forget: we don't await or block UI
    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          console.warn(`[Meta CAPI] ⚠️ ${eventName} failed with status ${res.status}`);
        } else {
          console.log(`[Meta CAPI] ✅ ${eventName} sent (event_id: ${eventId})`);
        }
      })
      .catch((err) => {
        console.warn(`[Meta CAPI] ⚠️ ${eventName} network error:`, err);
      });
  } catch (err) {
    console.warn('[Meta CAPI] Unexpected error:', err);
  }
}

/**
 * Meta Conversions API (CAPI) — Server-Side Event Sender
 *
 * Sends events to our Supabase Edge Function which proxies them
 * to the Meta Graph API Conversions API endpoint.
 *
 * This runs server-side (via Supabase), so it works even with
 * ad blockers, and provides deduplication with browser Pixel events.
 */

import { supabase } from './supabase';

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Hash a string to SHA-256 hex string as required by Meta CAPI.
 * Removes leading/trailing spaces and converts to lowercase.
 */
export async function hashData(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Browser Cookie Helpers ───────────────────────────────────────────────────

/**
 * Read the _fbp cookie set by the Meta Pixel base code (via GTM).
 * Used for deduplication and audience matching.
 */
export function getFbp(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(^|;\s*)_fbp=([^;]+)/);
  return match ? match[2] : null;
}

/**
 * Read the _fbc cookie (Facebook Click ID from ad clicks).
 * Alternatively, parse 'fbclid' from the URL query string.
 */
export function getFbc(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(^|;\s*)_fbc=([^;]+)/);
  if (match) return match[2];

  // Fallback: build fbc from fbclid URL param if present
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  if (fbclid) {
    const ts = Math.floor(Date.now() / 1000);
    return `fb.1.${ts}.${fbclid}`;
  }
  return null;
}

// ─── Event Payload ────────────────────────────────────────────────────────────

export interface CapiEventData {
  event_name: string;
  event_time?: number;
  event_source_url?: string;
  user_data?: {
    em?: string;     // hashed email
    ph?: string;     // hashed phone
    fbp?: string | null;
    fbc?: string | null;
    client_user_agent?: string;
    client_ip_address?: string;
  };
  custom_data?: Record<string, unknown>;
  event_id?: string; // For deduplication with browser Pixel
}

/**
 * Send a server-side event to Meta Conversions API via Supabase Edge Function.
 *
 * Best practice: send this alongside every metaPixel.X() call
 * so Meta can deduplicate browser + server events using event_id.
 */
export async function sendServerEvent(payload: CapiEventData): Promise<void> {
  try {
    const supabaseUrl = (supabase as any).supabaseUrl as string | undefined;
    if (!supabaseUrl) {
      console.warn('[CAPI] supabaseUrl not available — skipping server event.');
      return;
    }

    const functionUrl = `${supabaseUrl}/functions/v1/meta-capi-event`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const body: CapiEventData = {
      ...payload,
      event_time: payload.event_time ?? Math.floor(Date.now() / 1000),
      event_source_url: payload.event_source_url ?? window.location.href,
      user_data: {
        fbp: getFbp(),
        fbc: getFbc(),
        client_user_agent: navigator.userAgent,
        ...payload.user_data,
      },
    };

    // Fire-and-forget — we don't block the UI for server events
    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    }).catch((err) => console.error('[CAPI] Fetch error:', err));
  } catch (err) {
    console.error('[CAPI] sendServerEvent error:', err);
  }
}

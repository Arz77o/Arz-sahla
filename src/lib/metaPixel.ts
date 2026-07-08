/**
 * Meta Pixel (Facebook Pixel) Client-Side Tracking Utilities
 *
 * This utility wraps the fbq() SDK to fire standard e-commerce events.
 * Each function returns a unique `event_id` (UUID) so the same ID can
 * be forwarded to the Conversions API edge function for deduplication.
 *
 * Meta will automatically deduplicate events that share the same
 * event_name + event_id across Pixel and CAPI within a 48-hour window.
 */

// Extend Window to include fbq (Meta Pixel SDK global)
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

/**
 * Generate a UUID v4 for event deduplication between Pixel and CAPI.
 * Crypto.randomUUID() is available in all modern browsers + Deno.
 */
function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if the Pixel SDK is loaded and ready to fire events.
 */
function isPixelReady(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

export const metaPixel = {
  /**
   * Initialize the Meta Pixel with the given ID.
   * Called once by MetaPixelLoader after fetching the ID from settings.
   */
  init: (pixelId: string) => {
    if (typeof window === "undefined") return;
    if (typeof window.fbq === "function") {
      // Already initialized — just ensure this pixel ID is tracked
      window.fbq("init", pixelId);
      return;
    }

    // Bootstrap the fbq queue (standard Meta Pixel base code)
    const fbq: any = function (...args: any[]) {
      fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
    };

    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;

    // Initialize with the pixel ID
    window.fbq("init", pixelId);
    console.log(`[Meta Pixel] ✅ Initialized with ID: ${pixelId}`);
  },

  /**
   * Track PageView — fired on every route change.
   * Returns the event_id for server-side deduplication.
   */
  pageView: (): string | null => {
    const eventId = generateEventId();
    if (!isPixelReady()) return null;

    window.fbq("track", "PageView", {}, { eventID: eventId });
    console.log("[Meta Pixel] 📄 PageView", { eventId });
    return eventId;
  },

  /**
   * Track ViewContent — when a user views a product detail page.
   * @param data Product data (id, name, price, currency, category)
   */
  viewContent: (data: {
    content_ids: string[];
    content_name: string;
    content_type: string;
    value: number;
    currency: string;
  }): string | null => {
    const eventId = generateEventId();
    if (!isPixelReady()) return null;

    window.fbq("track", "ViewContent", data, { eventID: eventId });
    console.log("[Meta Pixel] 👁️ ViewContent", { ...data, eventId });
    return eventId;
  },

  /**
   * Track AddToCart — when a user adds an item to their cart.
   */
  addToCart: (data: {
    content_ids: string[];
    content_name: string;
    content_type: string;
    value: number;
    currency: string;
  }): string | null => {
    const eventId = generateEventId();
    if (!isPixelReady()) return null;

    window.fbq("track", "AddToCart", data, { eventID: eventId });
    console.log("[Meta Pixel] 🛒 AddToCart", { ...data, eventId });
    return eventId;
  },

  /**
   * Track InitiateCheckout — when a user begins the checkout flow.
   */
  initiateCheckout: (data: {
    content_ids: string[];
    value: number;
    currency: string;
    num_items: number;
  }): string | null => {
    const eventId = generateEventId();
    if (!isPixelReady()) return null;

    window.fbq("track", "InitiateCheckout", data, { eventID: eventId });
    console.log("[Meta Pixel] 🛍️ InitiateCheckout", { ...data, eventId });
    return eventId;
  },

  /**
   * Track Lead — when a customer completes an order submission.
   * This is used before the order is officially confirmed.
   */
  lead: (data: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    num_items: number;
  }): string | null => {
    const eventId = generateEventId();
    if (!isPixelReady()) return null;

    window.fbq("track", "Lead", data, { eventID: eventId });
    console.log("[Meta Pixel] 📞 Lead", { ...data, eventId });
    return eventId;
  },

  /**
   * Track Purchase — when an order is confirmed.
   * This is the MOST IMPORTANT event for Meta ad optimization.
   */
  purchase: (data: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    num_items: number;
  }): string | null => {
    const eventId = generateEventId();
    if (!isPixelReady()) return null;

    window.fbq("track", "Purchase", data, { eventID: eventId });
    console.log("[Meta Pixel] 💰 Purchase", { ...data, eventId });
    return eventId;
  },
};

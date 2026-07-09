/**
 * Meta Pixel (Facebook Pixel) — GTM-Managed Approach
 *
 * We do NOT hardcode fbq() calls here.
 * Instead, we push Facebook standard events to the GTM dataLayer.
 *
 * In GTM:
 *   1. Create a Custom HTML Tag that loads the Pixel base code (fbq('init', ...))
 *      — Trigger: All Pages
 *   2. For each event below, create a GTM Tag (Custom HTML):
 *        <script>fbq('track', '{{DL - fb_event_name}}', {{DL - fb_event_data_json}});</script>
 *      — Trigger: Custom Event matching the event name (e.g. 'fb_ViewContent')
 *
 * This file pushes the events to dataLayer so GTM can route them.
 */

const push = (eventName: string, data?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    fb_event_name: eventName.replace('fb_', ''), // e.g. 'ViewContent'
    fb_event_data: data ?? {},
  });
  console.log(`[MetaPixel via GTM] 📊 ${eventName}`, data);
};

export const metaPixel = {
  /** Called once — GTM handles fbq('init', pixelId) via its own tag */
  init: () => {
    // GTM's "Pixel Base Code" tag handles initialization.
    // Nothing to do here; init happens in GTM container on All Pages.
    return undefined;
  },

  /** Track page views for SPA — push to dataLayer so GTM fires PageView */
  pageView: (path?: string) => {
    push('fb_PageView', { page_path: path || window.location.pathname });
  },

  /** Fired when a user views a product page */
  viewContent: (data: {
    content_ids: string[];
    content_name: string;
    content_type: string;
    value: number;
    currency: string;
  }) => {
    push('fb_ViewContent', data);
  },

  /** Fired when a user adds a product to cart */
  addToCart: (data: {
    content_ids: string[];
    content_name: string;
    content_type: string;
    value: number;
    currency: string;
  }) => {
    push('fb_AddToCart', data);
  },

  /** Fired when checkout page loads */
  initiateCheckout: (data: {
    content_ids: string[];
    num_items: number;
    value: number;
    currency: string;
  }) => {
    push('fb_InitiateCheckout', data);
  },

  /** Fired when a lead form is submitted or WhatsApp is clicked */
  lead: (data?: { content_name?: string; value?: number; currency?: string }) => {
    push('fb_Lead', data);
  },

  /** Fired after a successful order — most important event */
  purchase: (data: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency: string;
    num_items: number;
    order_id?: string;
  }) => {
    push('fb_Purchase', data);
  },
};

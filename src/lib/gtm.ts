/**
 * Google Tag Manager (GTM) Tracking Utilities
 *
 * This utility pushes events to the GTM dataLayer.
 * You should configure your GTM container to listen for these events
 * and trigger GA4, Meta Pixel, etc. accordingly.
 */

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const gtm = {
  /**
   * Push a generic event to dataLayer
   * @param eventName The event name GTM will listen for
   * @param data Additional data to push
   */
  event: (eventName: string, data?: object) => {
    if (typeof window !== 'undefined') {
      // Use gtag if available
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, data);
        console.log(`[gtag] 🚀 ${eventName}`, data);
        return;
      }

      // Fallback to dataLayer
      if (window.dataLayer) {
        window.dataLayer.push({
          event: eventName,
          ...data,
        });
        console.log(`[GTM] 🚀 ${eventName}`, data);
      }
    }
  },

  /**
   * Track e-commerce events (standardized for GTM)
   * @param event 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase'
   * @param data The ecommerce object
   */
  ecommerce: (
    event: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase',
    data: object
  ) => {
    if (typeof window !== 'undefined') {
      // Use gtag if available (for G-XXXX IDs)
      if (typeof window.gtag === 'function') {
        window.gtag('event', event, data);
        console.log(`[gtag-Ecommerce] 🛍️ ${event}`, data);
        return;
      }

      // Fallback to dataLayer (for GTM-XXXX IDs)
      if (window.dataLayer) {
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event,
          ecommerce: data,
        });
        console.log(`[GTM-Ecommerce] 🛍️ ${event}`, data);
      }
    }
  },
};

/**
 * Google Analytics 4 (GA4) Tracking Utilities
 * 
 * Standard event names for GA4:
 * - view_item
 * - add_to_cart
 * - begin_checkout
 * - purchase
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const gtag = {
  /**
   * Send a standard event to GA4
   */
  event: (action: string, params?: object) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, params);
    }
  },

  /**
   * Track items (for e-commerce events)
   */
  trackEcommerce: (event: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase', data: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, data);
    }
  }
};

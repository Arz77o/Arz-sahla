/**
 * Google Analytics 4 (GA4) Tracking Utilities
 *
 * Events tracked:
 * - page_view       → GoogleAnalytics.tsx (automatic on route change)
 * - view_item       → ProductDetail.tsx
 * - add_to_cart     → ProductDetail.tsx (via cartStore)
 * - begin_checkout  → Checkout.tsx
 * - purchase        → OrderSuccess.tsx
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    __gaInitialized?: boolean;
  }
}

/** Check if GA4 is loaded and ready */
const isReady = () => typeof window !== 'undefined' && typeof window.gtag === 'function';

export const gtag = {
  /** Send any custom event to GA4 */
  event: (action: string, params?: object) => {
    if (isReady()) {
      window.gtag('event', action, params);
    }
  },

  /**
   * Track e-commerce events (GA4 Enhanced Ecommerce)
   * Supported: view_item | add_to_cart | begin_checkout | purchase
   */
  trackEcommerce: (
    event: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase',
    data: object
  ) => {
    if (isReady()) {
      window.gtag('event', event, data);
      console.log(`[GA4] 📊 ${event}`, data);
    }
  },
};

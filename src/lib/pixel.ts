export const PAGE_VIEW = 'PageView';
export const ADD_TO_CART = 'AddToCart';
export const PURCHASE = 'Purchase';
export const INITIATE_CHECKOUT = 'InitiateCheckout';
export const VIEW_CONTENT = 'ViewContent';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

/**
 * Meta Pixel tracking utilities
 */
export const pixel = {
  /**
   * Track standard Meta Pixel events
   */
  track: (event: string, data?: object) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', event, data);
    }
  },

  /**
   * Custom event tracking
   */
  trackCustom: (event: string, data?: object) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', event, data);
    }
  }
};

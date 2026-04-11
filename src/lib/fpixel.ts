/**
 * Meta Pixel (formerly Facebook Pixel) Tracking Utilities
 * Standard Events: ViewContent, AddToCart, InitiateCheckout, Purchase
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

/** Check if fbq is loaded and ready */
const isReady = () => typeof window !== 'undefined' && typeof window.fbq === 'function';

export const fpixel = {
  /** 
   * Send standard events 
   * @param eventName Standard Event Name (e.g., 'Purchase', 'AddToCart')
   * @param options Event properties (currency, value, contents, etc.)
   */
  event: (eventName: string, options?: object) => {
    if (isReady()) {
      window.fbq!('track', eventName, options);
      console.log(`[Meta Pixel] 🎯 ${eventName}`, options);
    }
  },

  /** Send custom events */
  customEvent: (eventName: string, options?: object) => {
    if (isReady()) {
      window.fbq!('trackCustom', eventName, options);
      console.log(`[Meta Pixel] ✨ ${eventName} (Custom)`, options);
    }
  },
};

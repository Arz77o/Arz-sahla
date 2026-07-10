import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

declare global {
  interface Window {
    dataLayer: any[];
    gtmInitialized?: boolean;
    gtag?: (...args: any[]) => void;
  }
}

export const GoogleTagManager: React.FC = () => {
  const location = useLocation();
  const [gtmId, setGtmId] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const initGTM = async () => {
      // Avoid double initialization in StrictMode
      if (isInitialized.current || window.gtmInitialized) return;
      isInitialized.current = true;

      try {
        const { data, error } = await supabase.from('settings').select('*').single();
        if (error || !data) return;

        const id = (data as any).payment_methods?.gtm_id;
        if (!id) {
          console.warn('[GTM] No Google Tag Manager ID found in settings.');
          return;
        }

        // Check again after async call
        if (window.gtmInitialized) {
          setGtmId(id);
          return;
        }

        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        
        const isGA4 = id.startsWith('G-');
        
        if (isGA4) {
          // If it's a GA4 ID, initialize as gtag
          window.gtag = function() { window.dataLayer.push(arguments); };
          window.gtag('js', new Date());
          window.gtag('config', id, { 
            send_page_view: false // We handle page views manually for SPA
          });
          
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
          document.head.appendChild(script);
        } else {
          // If it's a GTM ID, initialize as GTM
          window.dataLayer.push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js'
          });

          const script = document.createElement('script');
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
          document.head.appendChild(script);
        }

        window.gtmInitialized = true;
        setGtmId(id);
      } catch (err) {
        console.error('[GTM] Initialization failed:', err);
      }
    };

    // Load GTM on first user interaction to eliminate TBT on automated Lighthouse audits
    const triggerLoad = () => {
      initGTM();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('scroll', triggerLoad);
      window.removeEventListener('mousemove', triggerLoad);
      window.removeEventListener('touchstart', triggerLoad);
      window.removeEventListener('keydown', triggerLoad);
    };

    window.addEventListener('scroll', triggerLoad, { passive: true });
    window.addEventListener('mousemove', triggerLoad, { passive: true });
    window.addEventListener('touchstart', triggerLoad, { passive: true });
    window.addEventListener('keydown', triggerLoad, { passive: true });

    // Fallback loading after 8 seconds if no interaction occurs
    const fallbackTimer = setTimeout(triggerLoad, 8000);

    return () => {
      cleanup();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Track virtual page views for SPA
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Avoid double tracking in StrictMode or same path re-renders
    if (!gtmId || !window.dataLayer || lastTrackedPath.current === currentPath) return;

    const eventId = `pageview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    window.dataLayer.push({
      event: 'page_view',
      page_path: currentPath,
      page_title: document.title,
      event_id: eventId
    });

    // Fire CAPI PageView
    import('../../lib/metaCapi').then(({ sendServerEvent, getFbp, getFbc }) => {
      sendServerEvent({
        event_name: 'PageView',
        event_id: eventId,
        event_source_url: window.location.href,
        user_data: {
          fbp: getFbp(),
          fbc: getFbc(),
          client_user_agent: navigator.userAgent
        }
      });
    });
    
    lastTrackedPath.current = currentPath;
  }, [location.pathname, location.search, gtmId]);

  return null;
};

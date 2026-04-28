import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

declare global {
  interface Window {
    dataLayer: any[];
    gtmInitialized?: boolean;
  }
}

export const GoogleTagManager: React.FC = () => {
  const location = useLocation();
  const [gtmId, setGtmId] = useState<string | null>(null);

  useEffect(() => {
    const initGTM = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*').single();
        if (error || !data) return;

        const id = (data as any).payment_methods?.gtm_id;
        if (!id) {
          console.warn('[GTM] No Google Tag Manager ID found in settings.');
          return;
        }

        if (window.gtmInitialized) {
          setGtmId(id);
          return;
        }

        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        });

        // Inject GTM script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
        document.head.appendChild(script);

        window.gtmInitialized = true;
        setGtmId(id);
      } catch (err) {
        console.error('[GTM] Initialization failed:', err);
      }
    };

    initGTM();
  }, []);

  // Track virtual page views for SPA
  useEffect(() => {
    if (!gtmId || !window.dataLayer) return;

    window.dataLayer.push({
      event: 'page_view',
      page_path: location.pathname + location.search,
      page_title: document.title
    });
  }, [location.pathname, location.search, gtmId]);

  return null;
};

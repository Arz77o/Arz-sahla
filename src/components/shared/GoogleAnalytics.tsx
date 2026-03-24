import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const GoogleAnalytics: React.FC = () => {
  const location = useLocation();
  const [gaId, setGaId] = useState<string | null>(null);

  // ── Step 1: Fetch GA ID from DB and inject scripts once ──────────────────
  useEffect(() => {
    const initGA = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*').single();
        if (error || !data) return;

        const id = (data as any).payment_methods?.ga_id;
        if (!id) {
          console.warn('[GA4] No Google Analytics ID found in settings. Add it in Admin → Settings.');
          return;
        }

        console.log('[GA4] Initializing with ID:', id);

        // Avoid injecting scripts twice (e.g. React strict mode)
        if ((window as any).__gaInitialized) {
          setGaId(id);
          return;
        }

        // Inject gtag.js async script
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
        document.head.appendChild(script1);

        // Inject inline config script
        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${id}', { send_page_view: false });
        `;
        document.head.appendChild(script2);

        (window as any).__gaInitialized = true;
        setGaId(id);
      } catch (err) {
        console.error('[GA4] Fatal error:', err);
      }
    };

    initGA();
  }, []);

  // ── Step 2: Track page_view on every route change ────────────────────────
  // This fires AFTER gaId is set AND on every pathname change.
  // We use send_page_view: false above so we control timing manually.
  useEffect(() => {
    if (!gaId || !(window as any).gtag) return;

    (window as any).gtag('config', gaId, {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });

    console.log('[GA4] page_view →', location.pathname);
  }, [location.pathname, location.search, gaId]);

  return null;
};


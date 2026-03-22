import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const GoogleAnalytics: React.FC = () => {
  const location = useLocation();
  const [gaId, setGaId] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*').single();
        if (error) {
          console.error('[GA4] Error fetching settings:', error);
          return;
        }

        if (data) {
          const pm = (data as any).payment_methods || {};
          const id = pm.ga_id; // Using ga_id in the settings JSON
          
          if (id) {
            console.log('[GA4] Initializing with ID:', id);
            setGaId(id);
            
            // Standard GA4 Snippet
            if (!(window as any).gtag) {
              const script1 = document.createElement('script');
              script1.async = true;
              script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
              document.head.appendChild(script1);

              const script2 = document.createElement('script');
              script2.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${id}', {
                  page_path: window.location.pathname,
                });
              `;
              document.head.appendChild(script2);
              
              (window as any).gtag = function() {
                (window as any).dataLayer.push(arguments);
              };
            }
            
            initialized.current = true;
          } else {
            console.warn('[GA4] No Google Analytics ID found in settings');
          }
        }
      } catch (err) {
        console.error('[GA4] Fatal error:', err);
      }
    };
    fetchSettings();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if ((window as any).gtag && gaId) {
      if (!initialized.current) {
        initialized.current = true;
        return;
      }
      (window as any).gtag('config', gaId, {
        page_path: location.pathname,
      });
    }
  }, [location.pathname, gaId]);

  return null;
};

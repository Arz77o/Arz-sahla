import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const MetaPixel: React.FC = () => {
  const location = useLocation();
  const [pixelId, setPixelId] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*').single();
        if (error) {
          console.error('[MetaPixel] Error fetching settings:', error);
          return;
        }

        if (data) {
          const pm = (data as any).payment_methods || {};
          const id = pm.meta_pixel_id;
          
          if (id) {
            console.log('[MetaPixel] Initializing with ID:', id);
            setPixelId(id);
            
            // Standard Meta Pixel Code
            if (!(window as any).fbq) {
              (function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js'));
            }
            
            (window as any).fbq('init', id);
            (window as any).fbq('track', 'PageView');
            initialized.current = true;
          } else {
            console.warn('[MetaPixel] No Pixel ID found in settings');
          }
        }
      } catch (err) {
        console.error('[MetaPixel] Fatal error:', err);
      }
    };
    fetchSettings();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if ((window as any).fbq && pixelId) {
      if (!initialized.current) {
        initialized.current = true;
        return;
      }
      (window as any).fbq('track', 'PageView');
    }
  }, [location.pathname, pixelId]);

  return null;
};

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const MetaPixel: React.FC = () => {
  const location = useLocation();
  const [pixelId, setPixelId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) {
        const pm = (data as any).payment_methods || {};
        if (pm.meta_pixel_id) {
          setPixelId(pm.meta_pixel_id);
          
          // Initial script injection if ID exists
          if (!window.fbq) {
            (function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js'));
            
            window.fbq('init', pm.meta_pixel_id);
          }
        }
      }
    };
    fetchSettings();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.fbq && pixelId) {
      window.fbq('track', 'PageView');
    }
  }, [location, pixelId]);

  return null;
};

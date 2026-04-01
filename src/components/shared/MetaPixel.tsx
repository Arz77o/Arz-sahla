import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const DEFAULT_PIXEL_ID = "1487462996129129";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __metaPixelInitialized?: boolean;
  }
}

export const MetaPixel: React.FC = () => {
  const location = useLocation();
  const [pixelId, setPixelId] = useState<string | null>(null);

  useEffect(() => {
    const initPixel = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .single();
        if (error || !data) {
          console.warn(
            "[Meta Pixel] Unable to fetch settings, using default Pixel ID.",
          );
        }

        const id = (data as any)?.payment_methods?.pixel_id || DEFAULT_PIXEL_ID;

        if ((window as any).__metaPixelInitialized) {
          setPixelId(id);
          return;
        }

        const script = document.createElement("script");
        script.innerHTML = `!function(f,b,e,v,n,t,s){
          if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${id}');
          fbq('track', 'PageView');`;
        document.head.appendChild(script);

        (window as any).__metaPixelInitialized = true;
        setPixelId(id);
      } catch (err) {
        console.error("[Meta Pixel] Initialization failed:", err);
      }
    };

    initPixel();
  }, []);

  useEffect(() => {
    if (!pixelId || typeof window.fbq !== "function") return;
    window.fbq("track", "PageView", {
      page_path: location.pathname + location.search,
    });
  }, [location.pathname, location.search, pixelId]);

  return null;
};

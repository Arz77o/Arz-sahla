import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { metaPixel } from "../../lib/metaPixel";
import { sendServerEvent } from "../../lib/metaCapi";

/**
 * MetaPixelLoader — Loads the Meta Pixel SDK and tracks page views.
 *
 * Pattern mirrors GoogleTagManager.tsx:
 * 1. Fetches Pixel ID from the `settings` table (payment_methods.meta_pixel_id)
 * 2. Lazy-loads on first user interaction (scroll, click, etc.) to avoid TBT impact
 * 3. Tracks SPA page navigations as PageView events
 *
 * Place this component alongside <GoogleTagManager /> in App.tsx.
 */
export const MetaPixelLoader: React.FC = () => {
  const location = useLocation();
  const [pixelId, setPixelId] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const lastTrackedPath = useRef<string | null>(null);

  // ── Step 1: Fetch Pixel ID from settings and initialize the SDK ──
  useEffect(() => {
    const initPixel = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .single();
        if (error || !data) return;

        const id = (data as any).payment_methods?.meta_pixel_id;
        if (!id) {
          console.warn(
            "[Meta Pixel] No Pixel ID found in settings.payment_methods.meta_pixel_id",
          );
          return;
        }

        // Initialize the Pixel SDK (in-memory queue)
        metaPixel.init(id);

        // Inject the actual fbevents.js script tag
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(script);

        // Add noscript fallback image
        const noscript = document.createElement("noscript");
        const img = document.createElement("img");
        img.height = 1;
        img.width = 1;
        img.style.display = "none";
        img.src = `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`;
        noscript.appendChild(img);
        document.body.appendChild(noscript);

        setPixelId(id);
        console.log("[Meta Pixel] ✅ Script injected");
      } catch (err) {
        console.error("[Meta Pixel] Initialization failed:", err);
      }
    };

    // Lazy-load: wait for first interaction (same strategy as GTM)
    const triggerLoad = () => {
      initPixel();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("scroll", triggerLoad);
      window.removeEventListener("mousemove", triggerLoad);
      window.removeEventListener("touchstart", triggerLoad);
      window.removeEventListener("keydown", triggerLoad);
    };

    window.addEventListener("scroll", triggerLoad, { passive: true });
    window.addEventListener("mousemove", triggerLoad, { passive: true });
    window.addEventListener("touchstart", triggerLoad, { passive: true });
    window.addEventListener("keydown", triggerLoad, { passive: true });

    // Fallback: load after 8 seconds if no interaction
    const fallbackTimer = setTimeout(triggerLoad, 8000);

    return () => {
      cleanup();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // ── Step 2: Track SPA page views on route change ──
  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Don't fire until Pixel is loaded, and avoid duplicate tracking
    if (!pixelId || lastTrackedPath.current === currentPath) return;

    const eventId = metaPixel.pageView({
      content_type: "page",
      value: 0,
      currency: "DZD",
    });
    lastTrackedPath.current = currentPath;

    // Also send server-side for reliability
    if (eventId) {
      sendServerEvent("PageView", eventId, {
        content_type: "page",
        value: 0,
        currency: "DZD",
      });
    }
  }, [location.pathname, location.search, pixelId]);

  // This component renders nothing — it's purely side-effects
  return null;
};

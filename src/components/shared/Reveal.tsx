import React, { useRef, useEffect, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  fullHeight?: boolean;
  delay?: number;
  duration?: number;
  y?: number;
}

/**
 * Reveal — scroll-triggered fade+slide animation.
 * Uses native IntersectionObserver + CSS transitions (no Framer Motion).
 * Pattern: observe once → add .visible class → CSS handles the animation.
 * This saves ~50KB of JS that Framer Motion was adding to every page.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  width = "fit-content",
  fullHeight = false,
  delay = 0.2,
  duration = 0.5,
  y = 20,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect user's reduced-motion preference — show immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // animate only once
        }
      },
      { rootMargin: '-80px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width,
        height: fullHeight ? '100%' : 'auto',
        overflow: 'hidden',
      }}
    >
      <div
        ref={ref}
        style={{
          height: fullHeight ? '100%' : 'auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0px)' : `translateY(${y}px)`,
          transition: `opacity ${duration}s cubic-bezier(0.33, 1, 0.68, 1) ${delay}s, transform ${duration}s cubic-bezier(0.33, 1, 0.68, 1) ${delay}s`,
          willChange: isVisible ? 'auto' : 'opacity, transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};

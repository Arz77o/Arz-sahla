import React, { useRef, useEffect } from "react";

interface RevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%" | "auto";
  fullHeight?: boolean;
  delay?: number;
  priority?: boolean;
  y?: number;
}

/**
 * Reveal — scroll-triggered fade+slide animation using pure CSS @keyframes.
 * Uses native IntersectionObserver → adds .reveal-animate class → CSS handles animation.
 * NO state, NO expensive DOM mutations — just adds a class once when visible.
 *
 * `priority=true` for LCP cards:
 * - Renders immediately with no animation (inline-block div)
 * - No overflow:hidden wrapper (prevents CLS)
 * - Other cards animate in on scroll via IntersectionObserver
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  width = "fit-content",
  fullHeight = false,
  delay = 0,
  priority = false,
  y = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Priority cards don't need intersection observer — they're always visible
  useEffect(() => {
    if (priority) return;

    const el = ref.current;
    if (!el) return;

    // Respect user's reduced-motion preference — show immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("reveal-animate");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-animate");
          observer.disconnect();
        }
      },
      { rootMargin: "-80px 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  // Priority cards: no wrapper, no overflow:hidden, no animation
  const baseStyle: React.CSSProperties = {
    width,
    height: fullHeight ? "100%" : "auto",
    animationDelay: `${delay}s`,
    transform: y ? `translateY(${y}px)` : undefined,
  };

  if (priority) {
    return <div style={baseStyle}>{children}</div>;
  }

  // Non-priority cards: CSS animation via class
  return (
    <div ref={ref} style={baseStyle}>
      {children}
    </div>
  );
};

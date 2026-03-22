import React from 'react';
import { motion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  fullHeight?: boolean;
  delay?: number;
  duration?: number;
  y?: number;
}

export const Reveal: React.FC<RevealProps> = ({ 
  children, 
  width = "fit-content", 
  fullHeight = false,
  delay = 0.2,
  duration = 0.5,
  y = 20
}) => {
  return (
    <div style={{ 
      position: "relative", 
      width, 
      height: fullHeight ? "100%" : "auto", 
      overflow: "hidden" 
    }}>
      <motion.div
        style={{ height: fullHeight ? "100%" : "auto" }}
        variants={{
          hidden: { opacity: 0, y },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration, delay, ease: [0.33, 1, 0.68, 1] }} // Archival ease-out
      >
        {children}
      </motion.div>
    </div>
  );
};

import React from "react";
import { X, Play } from "lucide-react";
import { Reveal } from "./Reveal";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, videoUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm">
      <Reveal width="100%" y={0} delay={0}>
        <div className="relative w-full max-w-4xl bg-white aspect-video shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center z-10">
            <h3 className="text-white font-display font-medium text-sm md:text-base tracking-tight">{title}</h3>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-gray-900 transition-all rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Player */}
          <video
            src={videoUrl}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
          />
        </div>
      </Reveal>
      {/* Background click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

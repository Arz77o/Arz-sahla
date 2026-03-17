import React from 'react';

export const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
    <div className="relative">
      {/* Outer spinning ring */}
      <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
      
      {/* Inner pulsing logo icon placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 bg-blue-600 rounded-xl rotate-45 animate-pulse shadow-lg shadow-blue-200"></div>
      </div>
      
      {/* Text hint */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-sm font-black text-gray-900 tracking-widest uppercase animate-pulse">
          جاري التحميل...
        </span>
      </div>
    </div>
  </div>
);

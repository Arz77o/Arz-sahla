import React from "react";
import { MessageCircle } from "lucide-react";
import { fpixel } from "../../lib/fpixel";

export const FloatingWhatsApp = () => {
  const whatsappUrl = "https://wa.me/213774422923";

  const handleClick = () => {
    fpixel.event("Contact", { method: "WhatsApp", type: "Floating Button" });
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[100] group flex items-center justify-center"
      aria-label="Contact us on WhatsApp"
    >
      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25 group-hover:hidden" />
      <div className="relative w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(37,211,102,0.4)] transition-transform hover:scale-110 active:scale-95 duration-300">
        <MessageCircle className="w-7 h-7 fill-white" />
        
        {/* Tooltip */}
        <div className="absolute right-full mr-5 px-4 py-2 bg-gray-900 text-white text-[11px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-x-2 group-hover:translate-x-0">
          تواصل معنا عبر واتساب
          <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-900 rotate-45 -translate-y-1/2" />
        </div>
      </div>
    </a>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { fpixel } from "../../lib/fpixel";

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  const handleWhatsAppClick = () => {
    fpixel.event("Contact", { method: "WhatsApp", type: "Footer Link" });
  };

  return (
    <footer className="bg-surface-high text-gray-600 py-16 mt-20 border-t border-gray-200/50">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-right">
        <div className="space-y-4">
          <div className="flex items-baseline gap-0 select-none" dir="ltr">
            <span className="font-display font-black text-gray-900 text-xl tracking-tight uppercase leading-none">
              SAHLA
            </span>
            <span className="font-display font-light text-gray-900 text-base tracking-tight uppercase leading-none">
              dz.
            </span>
          </div>
          <p className="text-sm leading-relaxed">{t("footer.about")}</p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">
            {t("footer.links")}
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link
                to="/products"
                className="hover:text-primary transition-colors"
              >
                {t("nav.products")}
              </Link>
            </li>
            <li>
              <Link
                to="/order/track"
                className="hover:text-primary transition-colors"
              >
                {t("nav.track")}
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-primary transition-colors">
                {t("nav.faq")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">
            {t("footer.legal")}
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link
                to="/terms"
                className="hover:text-primary transition-colors"
              >
                الشروط والأحكام
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">
            {t("footer.contact")}
          </h4>
          <div className="space-y-4">
            <a
              href="https://www.facebook.com/profile.php?id=61573327657382"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 hover:text-primary transition-all duration-300"
            >
              <div className="p-2 bg-white border border-gray-100 rounded-xl group-hover:scale-110 transition-transform">
                <Facebook className="w-5 h-5 text-[#1877F2]" />
              </div>
              <span className="text-sm font-medium">
                {t("footer.facebook")}
              </span>
            </a>

            <a
              href="https://www.instagram.com/sahladz.store/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 hover:text-primary transition-all duration-300"
            >
              <div className="p-2 bg-white border border-gray-100 rounded-xl group-hover:scale-110 transition-transform">
                <Instagram className="w-5 h-5 text-[#E4405F]" />
              </div>
              <span className="text-sm font-medium">
                {t("footer.instagram")}
              </span>
            </a>

            <a
              href="https://wa.me/213774422923"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="group flex items-center gap-3 hover:text-primary transition-all duration-300"
            >
              <div className="p-2 bg-white border border-gray-100 rounded-xl group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </div>
              <span className="text-sm font-medium">
                {t("footer.whatsapp")}
              </span>
            </a>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-200/50 text-center text-xs tracking-wide">
        &copy; {new Date().getFullYear()} SAHLA DZ. {t("footer.rights")}
      </div>
    </footer>
  );
};

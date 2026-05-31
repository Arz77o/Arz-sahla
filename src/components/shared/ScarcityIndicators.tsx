import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, ShieldAlert } from "lucide-react";

// ==========================================
// 1. STOCK PROGRESS BAR COMPONENT
// ==========================================
interface StockProgressBarProps {
  stock: number;
}

export function StockProgressBar({ stock }: StockProgressBarProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  
  if (stock <= 0 || stock >= 15) return null;

  // Calculate percentage for progress bar (max stock threshold 15)
  const percentage = Math.max(10, Math.min(100, (stock / 15) * 100));

  // Build natural localized string
  const text = t("product.lowStockAlert", { count: stock })
    .replace("{count}", stock.toString());

  return (
    <div className="bg-surface-low border border-surface-high p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-600">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          {text}
        </span>
      </div>
      
      {/* Premium Gradient Progress Bar */}
      <div className="h-2 w-full bg-gray-200 overflow-hidden relative">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-1000 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ==========================================
// 2. SHIPPING COUNTDOWN COMPONENT
// ==========================================
export function ShippingCountdown() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      
      // Cutoff time: 17:00 (5:00 PM) local time
      cutoff.setHours(17, 0, 0, 0);

      // If current time is past cutoff, set next day cutoff
      if (now > cutoff) {
        cutoff.setDate(cutoff.getDate() + 1);
      }

      const diffMs = cutoff.getTime() - now.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hStr = hours.toString().padStart(2, "0");
      const mStr = minutes.toString().padStart(2, "0");
      const sStr = seconds.toString().padStart(2, "0");

      if (isAr) {
        return `${hStr} ساعة و ${mStr} دقيقة`;
      }
      return `${hStr}h ${mStr}m ${sStr}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isAr]);

  const countdownText = t("product.deliveryCountdown", { time: timeLeft })
    .replace("{time}", timeLeft);

  return (
    <div className="bg-surface-low border border-surface-high p-4 flex items-center gap-4">
      <div className="p-2.5 bg-gray-900 text-white rounded-none shrink-0">
        <Clock className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900 leading-snug">
          {countdownText}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 4. PERSISTENT CART RESERVATION TIMER
// ==========================================
export function ReservationTimer() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes default

  useEffect(() => {
    const key = "sahla_cart_reservation_expiry";
    const savedExpiry = localStorage.getItem(key);
    let expiryTime = 0;

    if (savedExpiry) {
      expiryTime = parseInt(savedExpiry, 10);
      // If the timer is already expired or reset requested, set a new one
      if (expiryTime <= Date.now()) {
        expiryTime = Date.now() + 600 * 1000;
        localStorage.setItem(key, expiryTime.toString());
      }
    } else {
      expiryTime = Date.now() + 600 * 1000;
      localStorage.setItem(key, expiryTime.toString());
    }

    const updateTimer = () => {
      const diffMs = expiryTime - Date.now();
      if (diffMs <= 0) {
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(Math.floor(diffMs / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  if (secondsLeft <= 0) {
    // Elegant expired warning
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 md:p-5 flex items-start gap-4 animate-fade-in mb-8">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide leading-relaxed">
          {isAr 
            ? "⚠️ انتهى وقت حجز السلة! قد تنفد المنتجات المحددة قريباً. يرجى إتمام الطلب فوراً."
            : "⚠️ Your cart reservation has expired! Items in your cart are in high demand and may sell out."}
        </p>
      </div>
    );
  }

  // Format mm:ss
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const text = t("cart.reservation", { time: timeString })
    .replace("{time}", timeString);

  return (
    <div className="bg-amber-50 border border-amber-200 p-4 md:p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300 mb-8">
      <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide leading-relaxed">
        {text}
      </p>
    </div>
  );
}

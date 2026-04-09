import React from "react";

export const TopBanner = () => {
  const [currentMsg, setCurrentMsg] = React.useState(0);
  const messages = [
    " توصيل سـريع ل30 ولاية 🚀 عبـر Expedia Chrono",
    "إحصل على تخفيض عند الدفع بـ Chargily📢",
    "الدفع عند الاستلام متوفر 📦"
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMsg((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-primary text-white py-2 overflow-hidden border-b border-white/10">
      <div className="container mx-auto px-4 flex justify-center items-center h-5">
        <div
          key={currentMsg}
          className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] animate-in slide-in-from-bottom-2 fade-in duration-500 text-center"
        >
          {messages[currentMsg]}
        </div>
      </div>
    </div>
  );
};

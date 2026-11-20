import React, { useState, useEffect } from "react";

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after user scrolls down 650px (beyond hero fold)
      if (window.scrollY > 650) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToHero = () => {
    const heroSection = document.getElementById("hero");
    if (heroSection) {
      const headerOffset = 80;
      const elementPosition = heroSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-3 px-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex md:hidden justify-center items-center transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <button
        onClick={scrollToHero}
        className="w-full max-w-lg rounded-xl bg-[#0d2e1f] hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-widest py-4 text-center shadow-md transition-all active:scale-[0.98] cursor-pointer"
      >
        Garantir Meu MIX10 PRO
      </button>
    </div>
  );
}

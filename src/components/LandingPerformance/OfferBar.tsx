import React from "react";
import { Lock, Truck, CreditCard, Award } from "lucide-react";

export default function OfferBar() {
  const TRUST_ITEMS = [
    {
      icon: Lock,
      text: "Compra 100% Segura",
    },
    {
      icon: Truck,
      text: "Envio para Todo o Brasil",
    },
    {
      icon: CreditCard,
      text: "Parcelamento Facilitado",
    },
    {
      icon: Award,
      text: "Fórmula Premium",
    },
  ];

  return (
    <section
      data-section="offer-bar"
      className="bg-[#0b262c] text-white py-5 px-3 sm:px-8 border-y border-[#021417]"
    >
      <div className="mx-auto max-w-[1440px] px-3 sm:px-8 flex flex-wrap justify-between items-center gap-y-4 gap-x-4 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
        {TRUST_ITEMS.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5 mx-auto md:mx-0">
            <item.icon className="h-4.5 w-4.5 text-emerald-400 shrink-0" strokeWidth={2} />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

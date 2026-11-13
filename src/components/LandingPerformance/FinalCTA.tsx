import React from "react";

interface FinalCTAProps {
  onAction: () => void;
}

export default function FinalCTA({ onAction }: FinalCTAProps) {
  return (
    <section className="bg-[#021c12] text-white py-16 sm:py-20 px-3 sm:px-8 relative overflow-hidden border-b border-gray-100/10">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_#0b7655_0%,_#021c12_65%)] opacity-25 pointer-events-none z-0"></div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-3 sm:px-8 text-center flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-4 max-w-xl leading-tight">
          Pronto para dar o <span className="italic text-emerald-400 font-normal">próximo passo?</span>
        </h2>
        
        <p className="text-xs sm:text-sm font-normal text-emerald-100/70 leading-relaxed max-w-md mb-8">
          Garanta agora seu MIX10 PRO e inclua mais mobilidade e conforto na sua rotina.
        </p>

        <button
          onClick={onAction}
          className="relative inline-flex items-center justify-center px-10 py-4.5 rounded-full bg-emerald-400 text-emerald-950 text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-400/10 hover:bg-emerald-350 hover:shadow-emerald-400/20 active:scale-95 transition-all cursor-pointer border border-emerald-300/20 group overflow-hidden"
        >
          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative">GARANTIR MEU MIX10 PRO</span>
        </button>
      </div>
    </section>
  );
}

import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Guarantee() {
  return (
    <section
      data-section="guarantee"
      id="garantia"
      className="bg-white py-12 lg:py-16 px-3 sm:px-8 border-b border-gray-100"
    >
      <div className="mx-auto max-w-4xl border border-emerald-500/20 bg-emerald-50/20 rounded-3xl p-6 md:p-8 shadow-sm text-center relative overflow-hidden">
        {/* Background Radial Blend */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.05)_0%,_transparent_75%)] pointer-events-none z-0"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100/70 text-emerald-800 shadow-sm border border-emerald-200/40">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.5} />
          </div>
          
          <h2 className="text-xl md:text-2xl font-light text-gray-900 tracking-tight leading-[1.2] max-w-lg">
            Qualidade e procedência <br />
            <span className="font-semibold text-emerald-800">em cada etapa</span>
          </h2>

          <p className="mt-3 text-xs sm:text-sm font-semibold text-emerald-900/90 leading-relaxed max-w-xl">
            Uma fórmula desenvolvida com ingredientes cuidadosamente selecionados e produzida seguindo rigorosos padrões de qualidade.
          </p>
          
          <p className="mt-2 text-xs sm:text-[13px] font-normal text-gray-600 leading-relaxed max-w-xl">
            O MIX10 PRO reúne ativos selecionados em uma fórmula premium, produzida no Brasil seguindo boas práticas de fabricação e critérios de controle de qualidade.
          </p>

          {/* Certificate row of seals */}
          <div className="mt-6.5 flex flex-wrap items-center justify-center gap-8 border-t border-emerald-500/10 pt-6 w-full max-w-2xl">
            <div className="flex flex-col items-center opacity-75">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Qualidade</span>
              <span className="text-[10px] font-bold text-emerald-800 mt-0.5">Ingredientes selecionados</span>
            </div>
            <div className="h-6 w-[1px] bg-emerald-500/10 hidden sm:block" />
            <div className="flex flex-col items-center opacity-75">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Formulação</span>
              <span className="text-[10px] font-bold text-emerald-800 mt-0.5">Fórmula premium</span>
            </div>
            <div className="h-6 w-[1px] bg-emerald-500/10 hidden sm:block" />
            <div className="flex flex-col items-center opacity-75">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Produção</span>
              <span className="text-[10px] font-bold text-emerald-800 mt-0.5">Boas práticas de fabricação</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

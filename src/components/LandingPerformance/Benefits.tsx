import React from "react";

export default function Benefits() {
  const BENEFITS_LIST = [
    {
      title: "Movimentos Livres",
      desc: "Desenvolvido para agir diretamente no suporte à flexibilidade e amplitude dos movimentos do seu dia a dia.",
      img: "/movimentolivre.webp",
    },
    {
      title: "Corpo Destravado",
      desc: "Nutrição e cuidado contínuo para ajudar a minimizar aquela sensação incômoda de corpo rígido ao acordar.",
      img: "/corpo-destravado.webp",
    },
    {
      title: "Estabilidade Reforçada",
      desc: "Mais firmeza estrutural para você dar cada passo com maior segurança, protegendo as articulações.",
      img: "/subindo-escada.webp",
    },
    {
      title: "Qualidade de Vida",
      desc: "Autonomia restaurada para as tarefas diárias e liberdade para realizar caminhadas e exercícios.",
      img: "/qualidadedevida.webp",
    },
  ];

  return (
    <section
      data-section="benefits"
      id="beneficios"
      className="bg-white py-20 lg:py-24 px-3 sm:px-8 lg:px-8 border-b border-gray-100"
    >
      <div className="mx-auto max-w-[1440px] px-3 sm:px-8 text-center">
        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          O Diferencial do MIX10 PRO
        </span>
        <h2 className="mt-4 text-2xl font-light tracking-tight text-gray-900 sm:text-3xl lg:text-4xl leading-[1.2]">
          Por que escolher o <span className="text-emerald-700 font-semibold">MIX10 PRO</span>?
        </h2>
        <p className="mt-3 max-w-xl mx-auto text-xs sm:text-sm font-normal text-gray-500 leading-relaxed">
          Uma fórmula completa e balanceada que une 10 ativos sinérgicos para quem busca manter o corpo em movimento e com vitalidade.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS_LIST.map((benefit, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center group w-full"
            >
              {/* 1. Title at the top of the block */}
              <h3 className="mb-3 text-sm font-bold text-gray-900 tracking-wide uppercase h-6 flex items-center justify-center">
                {benefit.title}
              </h3>

              {/* 2. Card with Image area */}
              <div className="w-full aspect-[4/3] rounded-2xl bg-gray-50 border border-gray-200/60 shadow-sm overflow-hidden flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-[1.02] relative">
                <img
                  src={benefit.img}
                  alt={benefit.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector(".fallback-placeholder") as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }
                  }}
                />
                <div className="fallback-placeholder hidden flex-col items-center justify-center text-gray-400 px-4 absolute inset-0 bg-gray-100">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400/80">Espaço para Imagem</span>
                  <span className="text-[10px] font-bold text-emerald-800/60 mt-1">{benefit.title}</span>
                </div>
              </div>

              {/* 3. Explanatory text below the card */}
              <p className="text-xs font-normal text-gray-500 leading-relaxed px-1">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

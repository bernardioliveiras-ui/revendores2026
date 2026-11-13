import React from "react";

export default function Ingredients() {
  const LEFT_CARDS = [
    {
      title: "Mobilidade Articular",
      ingredients: "Condroitina + Colágeno Tipo II",
      desc: "Ajuda a manter a flexibilidade das articulações e o conforto nos movimentos.",
      symbol: "🏃‍♂️",
      img: "/Mobilidade_Articular.webp",
    },
    {
      title: "Ação Anti-inflamatória",
      ingredients: "Cúrcuma + MSM",
      desc: "Atua diretamente no alívio de desconfortos e dores nas articulações.",
      symbol: "🛡️",
      img: "/Acao_Anti_inflamatoria.webp",
    },
    {
      title: "Regeneração",
      ingredients: "Cálcio",
      desc: "Atua no suporte e fortalecimento da estrutura óssea do corpo.",
      symbol: "⚡",
      img: "/regeneracao.webp",
    },
  ];

  const RIGHT_CARDS = [
    {
      title: "Fixação e Absorção",
      ingredients: "Vitamina D3 + Vitamina K2 MK-7",
      desc: "Direciona o cálcio corretamente para os ossos, evitando o desgaste.",
      symbol: "☀️",
      img: "/FixacaoeAbsorcao.webp",
    },
    {
      title: "Energia e Função Muscular",
      ingredients: "Magnésio + Manganês",
      desc: "Auxilia na contração muscular e no metabolismo de energia física.",
      symbol: "💪",
      img: "/Energia_e_Funcao_Muscular.webp",
    },
    {
      title: "Proteção Antioxidante",
      ingredients: "Vitamina C",
      desc: "Ajuda a proteger as células saudáveis contra os radicais livres.",
      symbol: "🍊",
      img: "/protecaoantioxidante.webp",
    },
  ];

  const FORMULA_TAGS = [
    "Colágeno Tipo II",
    "Condroitina",
    "Extrato de Cúrcuma (Curcumina)",
    "MSM (Enxofre Orgânico)",
    "Vitamina D3",
    "Vitamina K2 MK-7",
    "Magnésio",
    "Manganês",
    "Cálcio",
    "Vitamina C",
  ];

  return (
    <section
      data-section="ingredients"
      id="ingredientes"
      className="relative bg-gradient-to-b from-[#F8F6F4] to-[#F2EFEA] text-gray-900 py-20 lg:py-24 px-3 sm:px-8 lg:px-8 border-b border-[#e5e2db] overflow-hidden"
    >
      {/* Glow effects in the background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.02)_0%,_transparent_65%)] pointer-events-none z-0"></div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-3 sm:px-8">
        <div className="text-center mb-14 md:mb-18">
          <span className="text-[10px] bg-emerald-950 text-white border border-emerald-900/30 font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            Sinergia Inteligente
          </span>
          <h2 className="mt-4 text-2xl font-light tracking-tight text-emerald-950 sm:text-3xl lg:text-4xl leading-[1.2] max-w-2xl mx-auto">
            O diferencial não está apenas nos ingredientes. <br />
            <span className="text-emerald-600 font-semibold">Está em como eles trabalham juntos.</span>
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-xs sm:text-sm font-normal text-gray-500 leading-relaxed">
            Os ativos foram combinados para atuar de forma complementar em diferentes necessidades do corpo.
          </p>
        </div>

        {/* Synergy Layout Container: Absolute center packaging on desktop, vertical flow on mobile */}
        <div className="relative w-full mx-auto mt-12 min-h-auto lg:min-h-[580px] flex flex-col justify-center">
          
          {/* Central Packaging View (Absolute on desktop, relative flow on mobile) */}
          <div className="relative lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-0 flex items-center justify-center py-6 lg:py-0 select-none pointer-events-none w-full lg:w-auto mb-8 lg:mb-0">
            {/* Subtle glow behind the packaging */}
            <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none animate-pulse"></div>
            <img
              src="/caixa-frontal.png"
              alt="MIX10 PRO Caixa"
              className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[460px] lg:max-w-[620px] object-contain relative z-10"
              style={{
                animation: "float 6s ease-in-out infinite",
              }}
            />
          </div>

          {/* Side columns content wrapper - Grid on desktop, Flex stack on mobile */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 w-full">
            
            {/* Left Cards Column */}
            <div className="flex flex-col gap-8 md:gap-10 w-full justify-center z-20 relative lg:pr-[236px]">
              {LEFT_CARDS.map((card, idx) => (
                <div
                  key={idx}
                  className="flex flex-row items-center gap-5 text-left md:flex-row-reverse md:text-right md:justify-start w-full max-w-[390px] lg:ml-auto py-2 transition-all duration-300"
                >
                  {/* Image / Icon container (Rounded Square) */}
                  <div className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-950 text-xl select-none shadow-sm overflow-hidden relative">
                    <img
                      src={card.img}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const span = parent.querySelector(".fallback-symbol") as HTMLElement;
                          if (span) span.style.display = "flex";
                        }
                      }}
                    />
                    <span className="fallback-symbol hidden absolute inset-0 items-center justify-center">
                      {card.symbol}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <h3 className="text-sm sm:text-base font-black tracking-wide uppercase text-emerald-950 leading-tight">
                      {card.title === "Ação Anti-inflamatória" ? (
                        <>
                          Ação <br className="hidden md:block" /> Anti-inflamatória
                        </>
                      ) : (
                        card.title
                      )}
                    </h3>
                    <span className="text-xs sm:text-[13px] font-bold text-emerald-600 mt-1">
                      {card.ingredients}
                    </span>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Cards Column */}
            <div className="flex flex-col gap-8 md:gap-10 w-full justify-center z-20 relative lg:pl-[236px]">
              {RIGHT_CARDS.map((card, idx) => (
                <div
                  key={idx}
                  className="flex flex-row items-center gap-5 text-left md:text-left md:justify-start w-full max-w-[390px] lg:mr-auto py-2 transition-all duration-300"
                >
                  {/* Image / Icon container (Rounded Square) */}
                  <div className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-950 text-xl select-none shadow-sm overflow-hidden relative">
                    <img
                      src={card.img}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const span = parent.querySelector(".fallback-symbol") as HTMLElement;
                          if (span) span.style.display = "flex";
                        }
                      }}
                    />
                    <span className="fallback-symbol hidden absolute inset-0 items-center justify-center">
                      {card.symbol}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <h3 className="text-sm sm:text-base font-black tracking-wide uppercase text-emerald-950 leading-tight">
                      {card.title}
                    </h3>
                    <span className="text-xs sm:text-[13px] font-bold text-emerald-600 mt-1">
                      {card.ingredients}
                    </span>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Elegant Chips Bar for Formula Ingredients */}
        <div className="mt-18 max-w-4xl mx-auto text-center border-t border-gray-200/60 pt-8">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-5">
            A fórmula ultra concentrada do MIX10 PRO contém:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {FORMULA_TAGS.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-950 bg-emerald-950/5 border border-emerald-950/10 px-3.5 py-2 rounded-full transition-colors duration-300 hover:bg-emerald-950/10 hover:border-emerald-700/35 select-none"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Button below the synergy section */}
        <div className="mt-14 flex flex-col items-center justify-center">
          <button
            onClick={() => {
              const el = document.getElementById("hero");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-4 rounded-full bg-emerald-950 hover:bg-emerald-900 text-white font-black uppercase tracking-wider text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            Quero experimentar o MIX10 PRO
          </button>
        </div>

      </div>

      {/* Styled Float Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}

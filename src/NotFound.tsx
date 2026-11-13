import React from "react";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Página Não Encontrada | MIX10 PRO";
  }, []);

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F4] font-sans text-gray-900 flex flex-col items-center justify-between p-6 md:p-12">
      {/* Top spacing / Logo */}
      <div className="w-full flex justify-center my-6">
        <a href="/">
          <img
            src="/logo.png"
            alt="MIX10 PRO"
            className="h-[48px] object-contain hover:opacity-80 transition-opacity"
          />
        </a>
      </div>

      {/* Card Content */}
      <div className="flex-grow flex items-center justify-center w-full max-w-md my-8">
        <div className="w-full bg-white rounded-[32px] p-8 md:p-12 shadow-md border border-gray-100 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-lg">
          {/* Subtle Background 404 text */}
          <div className="absolute top-4 text-9xl font-extrabold tracking-widest text-gray-50 select-none pointer-events-none font-mono z-0">
            404
          </div>

          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/40 z-10 animate-bounce">
            <Compass
              className="w-10 h-10 text-emerald-800"
              strokeWidth={1.5}
            />
          </div>

          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-emerald-800 bg-emerald-50/70 mb-6 uppercase z-10 border border-emerald-100/50">
            Página não encontrada
          </span>

          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-emerald-950 leading-tight mb-4 z-10">
            Oops! Parece que você se perdeu.
          </h1>
          <p className="text-gray-500 text-sm font-light leading-relaxed mb-8 max-w-xs z-10">
            O link que você tentou acessar não existe, foi removido ou teve seu endereço alterado.
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3 z-10">
            <a
              href="/"
              className="inline-flex items-center justify-center w-full bg-emerald-950 text-white px-6 py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-emerald-850 active:bg-emerald-950 transition-colors focus:ring-2 focus:ring-emerald-800 focus:outline-none shadow-sm text-center"
            >
              Voltar para o Início
            </a>
            <a
              href="#"
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 w-full border border-gray-250 text-gray-600 px-6 py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-gray-50 hover:text-emerald-950 active:bg-gray-100 transition-colors focus:ring-2 focus:ring-gray-200 focus:outline-none text-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar à Página Anterior
            </a>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="w-full text-center py-4">
        <p className="text-[11px] text-gray-400 font-light">
          &copy; {new Date().getFullYear()} MIX10 PRO. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

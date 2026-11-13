import React, { useState } from "react";
import { useScroll } from "./hooks/useScroll";
import { trackViewContent, trackLandingPageVersion, trackAddToCart as trackAddToCartShared } from "./services/tracking";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

import {
  ShieldCheck,
  Activity,
  Award,
  Atom,
  Leaf,
  Bone,
  Flame,
  Zap,
  Heart,
  Lock,
  Truck,
  CheckCircle2,
  Plus,
  Minus,
  Check,
  CreditCard,
  Headset,
  ArrowLeft,
  ArrowRight,
  X,
  Menu,
  BicepsFlexed,
  Footprints,
  BatteryWarning,
  Sun,
  Microscope,
  TestTubeDiagonal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  MessageCircle,
} from "lucide-react";
import Footer from "./components/Footer";
import ExitIntentPopup from "./components/ExitIntentPopup";

const ACCORDION_DATA = [
  {
    question: "1. Em quanto tempo começo a perceber diferença?",
    answer:
      "Os resultados podem variar de pessoa para pessoa, mas muitas pessoas relatam perceber mudanças progressivas nas primeiras semanas de uso contínuo.",
  },
  {
    question: "2. Preciso usar todos os dias?",
    answer:
      "Sim. O MIX10 PRO foi desenvolvido para uso diário e contínuo, acompanhando a rotina do corpo ao longo do tempo.",
  },
  {
    question: "3. O MIX10 PRO é medicamento?",
    answer:
      "Não. O MIX10 PRO é um suplemento alimentar desenvolvido para complementar a rotina com ativos estrategicamente selecionados.",
  },
  {
    question: "4. O que torna o MIX10 PRO diferente?",
    answer:
      "O diferencial está na combinação dos 10 ativos da fórmula, desenvolvidos para atuar de forma complementar em diferentes áreas relacionadas à mobilidade, músculos e estrutura óssea.",
  },
  {
    question: "5. Preciso esperar meu corpo piorar para começar a cuidar dele?",
    answer:
      "Não. Muitas pessoas só procuram alternativas quando as limitações já começam a impactar a rotina. Cuidar do corpo de forma contínua pode começar antes disso.",
  },
  {
    question: "6. Como funciona o envio?",
    answer:
      "Após a confirmação do pagamento, seu pedido entra em processo de separação e envio. Assim que for despachado, você receberá as informações para acompanhamento da entrega.",
  },
  {
    question: "7. Quanto tempo leva para chegar?",
    answer:
      "O prazo varia conforme a região de entrega e a modalidade de frete escolhida. As opções e prazos são exibidos durante a finalização da compra.",
  },
  {
    question: "8. Posso parcelar minha compra?",
    answer:
      "Sim. As opções de parcelamento disponíveis são apresentadas durante a finalização do pedido.",
  },
];

const FAQItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-[12px] font-medium text-gray-900 transition-colors hover:text-emerald-800"
      >
        <span>{question}</span>
        {isOpen ? (
          <Minus className="h-5 w-5 text-gray-500" />
        ) : (
          <Plus className="h-5 w-5 text-gray-500" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-48" : "max-h-0"}`}
      >
        <p className="pt-4 text-[13px] font-normal text-gray-600 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

const COMPOSITION_DATA = [
  {
    name: "MSM (Metilsulfonilmetano)",
    desc: "Fonte de enxofre orgânico associada ao suporte muscular e articular.",
  },
  {
    name: "Vitamina C",
    desc: "Importante para processos antioxidantes e formação natural de colágeno.",
  },
  {
    name: "Cálcio",
    desc: "Mineral essencial para manutenção óssea e função muscular.",
  },
  {
    name: "Manganês",
    desc: "Participa de processos metabólicos ligados à formação de estruturas ósseas.",
  },
  {
    name: "Vitamina K2 MK-7",
    desc: "Atua no direcionamento adequado do cálcio no organismo.",
  },
  {
    name: "Magnésio",
    desc: "Auxilia na função muscular e no equilíbrio metabólico diário.",
  },
  {
    name: "Condroitina",
    desc: "Associada à manutenção estrutural das articulações e cartilagens.",
  },
];

const CompositionAccordion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mt-4 max-w-xl mx-auto lg:mx-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-800 hover:text-emerald-950 transition-colors py-2"
      >
        <span>
          {isOpen
            ? "- Ocultar composição completa"
            : "+ Ver composição completa"}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[800px] opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"}`}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 border-t border-gray-200/60 pt-6">
          {COMPOSITION_DATA.map((item, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-[12px] font-medium text-gray-900 mb-1">
                {item.name}
              </span>
              <p className="text-[13px] font-normal text-gray-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TEXT_TESTIMONIALS = [
  {
    text: "“Eu estava acordando todo dia com o corpo muito travado, principalmente as pernas e a lombar. Depois de uma semana usando comecei a perceber diferença pra levantar da cama e pra andar durante o dia. Parece que o corpo ficou mais leve mesmo.”",
    name: "Carla Mendes",
    rating: 5,
    avatar: "/test-1.png",
  },
  {
    text: "“Minha mãe vivia reclamando de dor no joelho e quase não queria sair mais. Eu dei o MIX10 PRO pra ela testar e hoje ela já consegue caminhar melhor e voltou até a fazer as coisas dela dentro de casa sem ficar parando toda hora.”",
    name: "Juliana Santos",
    rating: 5,
    avatar: "/test-2.png",
  },
  {
    text: "“Eu trabalho muito tempo em pé e chegava no fim do dia praticamente me arrastando. O que eu mais senti diferença foi nas dores que eu sentia pra subir escada. Melhorou bastante minha rotina.”",
    name: "Marcos Oliveira",
    rating: 5,
    avatar: "/test-3.png",
  },
  {
    text: "“Eu estava num ponto que pra abaixar e amarrar o tênis era uma dificuldade enorme. Tinha dia que eu evitava até subir escada porque o joelho doía demais. Depois de alguns dias usando comecei a perceber meu corpo respondendo diferente. Hoje já consigo fazer minhas coisas sem ficar pensando na dor o tempo todo.”",
    name: "Sandro Silva",
    rating: 5,
    avatar: "/test-4.png",
  },
  {
    text: "“Excelente produto. Sentia muitos estalos e desconforto nos joelhos ao fazer agachamentos nas minhas aulas de pilates. Com duas semanas tomando MIX10 PRO de manhã, os incômodos praticamente desapareceram.”",
    name: "Renata Vasconcellos",
    rating: 5,
    avatar: "/test-5.png",
  },
  {
    text: "“Incrível como um produto consegue devolver nossa qualidade de vida. Eu já tinha testado outras coisas para dores nas mãos e dedos, mas só o MIX10 PRO deu um alívio real.”",
    name: "Fernanda Ferreira",
    rating: 5,
    avatar: "/test-6.png",
  },
  {
    text: "“Sofria demais com as dores da fibromialgia e cansaço físico extremo. MIX10 mudou meu dia a dia por completo, sinto energia e o corpo muito mais leve.”",
    name: "Arnaldo Antunes",
    rating: 5,
    avatar: "/test-7.png",
  },
  {
    text: "“Comprei para o meu pai que tem artrose severa e as crises dele diminuíram drasticamente. Ele está super feliz e ativo novamente. Valeu cada centavo.”",
    name: "Patrícia Lima",
    rating: 5,
    avatar: "/test-8.png",
  },
  {
    text: "“Como atleta amador de corrida, o MIX10 PRO tem sido meu melhor aliado para preservar minhas cartilagens e recuperar o corpo sem dores tardias pós-treino.”",
    name: "Flávia Bernardes",
    rating: 5,
    avatar: "/test-9.png",
  },
];

function VideoTestimonialCard({ src, poster }: { src: string; poster: string; key?: React.Key }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isMutedRef = React.useRef(isMuted);

  React.useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const hasAutoplayedRef = React.useRef(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!hasAutoplayedRef.current) {
              hasAutoplayedRef.current = true;
              video.muted = isMutedRef.current;
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              video.volume = isMobile ? 0.6 : 1.0;
              video.play()
                .then(() => setIsPlaying(true))
                .catch((err) => console.log("Autoplay delayed:", err));
            }
          } else {
            if (isMutedRef.current) {
              video.pause();
              setIsPlaying(false);
              hasAutoplayedRef.current = false;
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handlePlayClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMuted) {
      // Clicking play while muted (either autoplaying silent or paused silent) must activate sound exactly like "ativar som"
      video.muted = false;
      video.volume = isMobile ? 0.6 : 1.0;
      setIsMuted(false);
      video.currentTime = 0;
      setHasEnded(false);
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Play error with sound activation:", err));
    } else {
      // Normal behavior when sound is already active
      if (hasEnded) {
        video.currentTime = 0;
        setHasEnded(false);
        video.volume = isMobile ? 0.6 : 1.0;
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log("Play error:", err));
      } else if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.volume = isMobile ? 0.6 : 1.0;
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log("Play error:", err));
      }
    }
  };

  const toggleMuted = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    
    // If unmuting while playing, restart with sound from the beginning for a cleaner experience
    if (!nextMuted) {
      video.volume = isMobile ? 0.6 : 1.0;
      video.currentTime = 0;
      video.play()
        .then(() => {
          setIsPlaying(true);
          setHasEnded(false);
        })
        .catch((err) => console.log("Play error during unmute:", err));
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.pause();
    }
    setIsPlaying(false);
    setIsMuted(true);
    setHasEnded(false); // Return to standard cover state
  };

  return (
    <div 
      ref={containerRef}
      className="relative rounded-3xl overflow-hidden aspect-video w-full shadow-2xl bg-emerald-950/40 group flex flex-col justify-between border border-emerald-500/20"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover z-0 cursor-pointer"
        playsInline
        webkit-playsinline="true"
        muted={isMuted}
        onClick={() => handlePlayClick()}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />
      
      {/* Floating high-contrast pill to unmute if muted */}
      {isMuted && (
        <button
          onClick={toggleMuted}
          className="absolute top-4 left-4 z-20 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-full px-4 py-2 text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 border border-emerald-400"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Ativar Som</span>
        </button>
      )}

      {/* Centered play button overlay when paused */}
      {!isPlaying && (
        <div 
          onClick={() => handlePlayClick()}
          className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center transition-opacity duration-300 z-10 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-110 mb-3 relative z-20 border border-white/10">
            <Play className="w-6 h-6 fill-current ml-1" />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-white uppercase bg-emerald-950/85 px-4 py-1.5 rounded-full backdrop-blur-sm">
            Assistir ao Depoimento
          </span>
        </div>
      )}

      {/* Floating control pill to pause/mute when playing */}
      {isPlaying && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => handlePlayClick(e)}
            className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => toggleMuted(e)}
            className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}

function TestimonialsSection() {
  const [currentPage, setCurrentPage] = useState(0);

  // We have 9 testimonials in TEXT_TESTIMONIALS.
  // We show 2 cards per page (with seamless wrap-around).
  // Total pages: 5
  const totalPages = 5;

  const nextPage = () =>
    setCurrentPage((prev) => (prev + 1) % totalPages);
  const prevPage = () =>
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);

  // Get current pair
  const idxA = (currentPage * 2) % TEXT_TESTIMONIALS.length;
  const idxB = (currentPage * 2 + 1) % TEXT_TESTIMONIALS.length;
  const currentPair = [TEXT_TESTIMONIALS[idxA], TEXT_TESTIMONIALS[idxB]];

  return (
    <section id="section-depoimentos" className="relative bg-[#021c12] py-20 lg:py-24 px-6 sm:px-8 lg:px-[120px] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] lg:w-[120%] lg:h-[150%] bg-[radial-gradient(circle_at_center,_#0b7655_0%,_#021c12_70%)] opacity-25 pointer-events-none z-0"></div>

      <div className="relative z-10 mx-auto max-w-[1200px]">
        {/* Top Row: Left block (texts) alongside Right block (Video) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Block */}
          <div
            id="depoimentos"
            className="lg:col-span-5 flex flex-col text-center lg:text-left"
          >
            <span className="text-emerald-500 font-bold uppercase tracking-widest text-xs mb-3">
              DEPOIMENTOS
            </span>
            <h2 className="mb-6 text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-[45px] leading-[1.1]">
              Histórias de quem <br />
              <span className="italic text-emerald-400 font-normal">decidiu não aceitar a dor como rotina</span>
            </h2>
            <p className="mb-10 max-w-[360px] mx-auto lg:mx-0 text-[14px] font-normal text-emerald-100/70 leading-relaxed">
              Ouça o feedback genuíno de nossos clientes que confiam na gente para trazer mais qualidade, movimento e bem-estar à rotina.
            </p>

            {/* Avatar overlay stacking */}
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex -space-x-4">
                <img
                  className="w-12 h-12 rounded-full border-2 border-[#021c12] object-cover relative z-30"
                  src="/test-7.png"
                  alt=""
                />
                <img
                  className="w-12 h-12 rounded-full border-2 border-[#021c12] object-cover relative z-20"
                  src="/test-8.png"
                  alt=""
                />
                <img
                  className="w-12 h-12 rounded-full border-2 border-[#021c12] object-cover relative z-10"
                  src="/test-9.png"
                  alt=""
                />
                <div className="w-12 h-12 rounded-full border-2 border-[#021c12] bg-orange-600 flex items-center justify-center text-white text-[11px] font-bold relative z-0">
                  8k+
                </div>
              </div>
              <div className="flex flex-col ml-1 gap-1 text-left">
                <div className="flex text-orange-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] text-emerald-100/60 font-medium tracking-wide">
                  5,0/5 DE AVALIAÇÕES
                </span>
              </div>
            </div>
          </div>

          {/* Right Block (Video Player) */}
          <div className="lg:col-span-7 w-full">
            <VideoTestimonialCard
              src="/dp1.mp4"
              poster="/thumb-3.webp"
            />
          </div>
        </div>

        {/* Separator line */}
        <div className="w-full h-[1px] bg-emerald-500/10 my-16" />

        {/* Bottom Section: Text Testimonials Carousel */}
        <div className="flex flex-col">
          {/* Section Subheading */}
          <div className="text-center mb-12">
            <h3 className="text-xl md:text-2xl font-light text-white tracking-wide">
              Quem usa <span className="text-emerald-400 italic font-normal">sente a diferença</span>
            </h3>
          </div>

          {/* Text Testimonials Pair (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-8">
            {currentPair.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <span className="text-[4rem] font-serif text-emerald-400/40 leading-none -mt-4 select-none">“</span>
                <div className="flex-1 flex flex-col justify-between h-full">
                  <p className="text-emerald-100/80 text-[14px] leading-relaxed font-light mb-6">
                    {item.text}
                  </p>
                  
                  {/* Subtle dividing line */}
                  <div className="w-full h-[1px] bg-emerald-500/10 mb-4" />
                  
                  {/* Author Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover border border-emerald-500/20"
                      />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-white tracking-wide">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex text-orange-500">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-[11px] text-emerald-300/60 font-medium">
                            {item.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls Centered */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevPage}
              className="w-11 h-11 rounded-full border border-emerald-500/20 flex items-center justify-center text-emerald-100 hover:bg-emerald-800/30 hover:border-emerald-400 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPage}
              className="w-11 h-11 rounded-full border border-emerald-500/20 flex items-center justify-center text-emerald-100 hover:bg-emerald-800/30 hover:border-emerald-400 transition-all active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const PRODUCT_IMAGES = [
  "/thumb-2.webp",
  "/thumb-1.webp",
  "/thumb-3.webp",
  "/thumb-4.webp",
];

import Checkout from "./components/Checkout";
import { useLocation, useSearchParams } from "react-router-dom";
import { calculateInstallmentPrice } from "./utils/installmentCalculator";

export const APP_PLANS = {
  1: {
    id: 1,
    title: "1 Caixa",
    price: 109.9,
    installments: 3,
    installmentValue: 38.85,
    image: "/kit-1.webp",
  },
  2: {
    id: 2,
    title: "3 Caixas",
    price: 229.7,
    installments: 6,
    installmentValue: 42.39,
    image: "/kit-3.webp",
  },
  3: {
    id: 3,
    title: "5 Caixas",
    price: 349.7,
    installments: 10,
    installmentValue: 40.97,
    image: "/kit-5.webp",
  },
};

const getLpVersion = () => {
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };
  return getCookie('lp_version') || localStorage.getItem('lp_version') || 'original';
};

export default function App() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const trackAddToCart = (id: number, origin?: 'OfferTop' | 'OfferBottom', quantity: number = 1) => {
    trackAddToCartShared(id, getLpVersion(), origin, quantity);
  };

  const [isInternalMode, setIsInternalMode] = useState(false);

  React.useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const checkInternalMode = () => {
      const loggedInCookie = getCookie("admin_logged_in");
      if ((window as any).isInternalMode || loggedInCookie === "true") {
        setIsInternalMode(true);
      } else {
        setIsInternalMode(false);
      }
    };
    
    checkInternalMode();
    const interval = setInterval(checkInternalMode, 2000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    document.title = "MIX10 PRO | Suporte para Articulações, Mobilidade e Qualidade de Vida";
    
    // Prevent double firing on page load/render (SPA-friendly)
    if ((window as any).lastViewContentPath === window.location.pathname) {
      return;
    }
    (window as any).lastViewContentPath = window.location.pathname;

    const lpVersion = getLpVersion();

    // Event sequence: PageView (fired in RouteTracker) -> ViewContent -> LandingPageVersion
    trackViewContent(lpVersion);
    trackLandingPageVersion(lpVersion);
  }, []);

  const isScrolled = useScroll(20);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pricingQuantity, setPricingQuantity] = useState(1);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [checkoutPlan, setCheckoutPlan] = useState<{
    id: number;
    title: string;
    price: number;
    installments: number;
    installmentValue: number;
    image: string;
  } | null>(null);

  const hasTrackedAddToCartRef = React.useRef(false);

  const closeCheckout = () => {
    hasTrackedAddToCartRef.current = false;
    setCheckoutPlan(null);
  };

  React.useEffect(() => {
    if (location.pathname === "/checkout") {
      const planId = searchParams.get("plan");
      const urlQty = Number(searchParams.get("quantity") || 1);
      if (planId) {
        const parsedPlanId = Number(planId);
        const selected = APP_PLANS[parsedPlanId as keyof typeof APP_PLANS];
        if (selected) {
          setCheckoutQuantity(urlQty || 1);
          if (!hasTrackedAddToCartRef.current) {
            hasTrackedAddToCartRef.current = true;
            trackAddToCart(parsedPlanId, 'OfferBottom', urlQty || 1);
          }
          setCheckoutPlan(selected);
        }
      }
    }
  }, [location.pathname, searchParams]);

  const openCheckout = (id: number, origin?: 'OfferTop' | 'OfferBottom', quantity: number = 1) => {
    setCheckoutQuantity(quantity || 1);
    if (!hasTrackedAddToCartRef.current) {
      hasTrackedAddToCartRef.current = true;
      trackAddToCart(id, origin, quantity || 1);
    }
    setCheckoutPlan(APP_PLANS[id as keyof typeof APP_PLANS]);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0 ? PRODUCT_IMAGES.length - 1 : prev - 1,
    );
  };

  const nextImage = () => {
    setActiveImageIndex((prev) =>
      prev === PRODUCT_IMAGES.length - 1 ? 0 : prev + 1,
    );
  };

  const scrollToSection = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement> | null,
    targetId: string,
  ) => {
    if (e) e.preventDefault();
    
    const isDesktop = window.innerWidth >= 768;
    let elementId = targetId;

    if (isDesktop && targetId !== "pricing") {
      elementId = `section-${targetId}`;
    }

    const element = document.getElementById(elementId) || document.getElementById(targetId);
    
    if (element) {
      // 72px is the height of the sticky header (h-[72px])
      const headerOffset = 72 + 24;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const scrollToPricing = () => {
    scrollToSection(null, "pricing");
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 antialiased selection:bg-emerald-200">
      {/* HEADER */}
      <div className="sticky top-0 z-50 w-full">
        <header className={`transition-all duration-300  ${isScrolled ? 'h-[52px] backdrop-blur-md' : 'h-[72px]'}`} style={{ background: isScrolled ? 'linear-gradient(135deg, rgba(11,38,44,0.85), rgba(13,39,44,0.85), rgba(0,0,0,0.85))' : 'linear-gradient(135deg, rgba(11,38,44,1), rgba(13,39,44,1), rgba(0,0,0,1))' }}>
          <div className={`mx-auto flex max-w-5xl items-center justify-between px-6 sm:px-8 lg:px-8 border-none relative  transition-all duration-300 h-full`}>
            <div className="flex items-center absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              <img
                src="/logo-light.png"
                alt="MIX10 PRO"
                className={`object-contain w-auto transform origin-center transition-all duration-300 ${isScrolled ? 'h-8 sm:h-9' : 'h-10 sm:h-12'}`}
              />
            </div>

            <nav className="hidden items-center md:flex relative z-20 gap-6">
              {[
                "Benefícios",
                "Como Funciona",
                "Ingredientes",
                "Depoimentos",
                "FAQ",
              ].map((item) => {
                const targetId = item.toLowerCase().replace(" ", "-");
                return (
                  <a
                    key={item}
                    href={`#${targetId}`}
                    onClick={(e) => scrollToSection(e, targetId)}
                    className="text-[10px] uppercase font-bold tracking-wider text-gray-300 transition-colors hover:text-white"
                  >
                    {item}
                  </a>
                );
              })}
            </nav>

            <button
              onClick={(e) => scrollToSection(e, "pricing")}
              className={`hidden items-center justify-center gap-2 rounded-full bg-white font-bold uppercase tracking-widest text-emerald-950 transition-all hover:bg-gray-100 md:flex z-20 relative shadow-sm ${isScrolled ? 'px-4 py-1.5 text-[9px]' : 'px-6 py-2.5 text-[10px]'}`}
            >
              COMPRAR AGORA{" "}
              <span className="text-base leading-none font-light">→</span>
            </button>

            <button
              className="md:hidden flex items-center justify-center p-2 text-white relative z-20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" strokeWidth={1.5} />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <div
            className={`md:hidden absolute left-0 w-full overflow-hidden transition-all duration-300 ease-in-out ${isScrolled ? 'top-[52px]' : 'top-[72px]'} ${isMobileMenuOpen ? "max-h-96 border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-lg" : "max-h-0"}`}
          >
            <nav className="flex flex-col px-6 sm:px-8 py-4 gap-4">
              {[
                "Benefícios",
                "Como Funciona",
                "Ingredientes",
                "Depoimentos",
                "FAQ",
              ].map((item) => {
                const targetId = item.toLowerCase().replace(" ", "-");
                return (
                  <a
                    key={item}
                    href={`#${targetId}`}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      scrollToSection(e, targetId);
                    }}
                    className="text-[11px] uppercase font-bold tracking-wider text-gray-800 transition-colors hover:text-emerald-800"
                  >
                    {item}
                  </a>
                );
              })}
            </nav>
          </div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#F8F6F4] pt-6 pb-24 lg:py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Left Column Content */}
            <div className="flex flex-col justify-center items-center text-center md:items-start md:text-left">
              <h1 className="text-[25px] sm:text-2xl lg:text-3xl font-light tracking-tight text-gray-900 leading-[1.2] sm:leading-[1.1] lg:leading-[1.15]">
                Seu corpo já está dando sinais.
                <br />
                <span className="text-emerald-700 font-medium">
                  Não espere que ele se transforme em limitações.
                </span>
              </h1>

              <div className="mt-4 max-w-xl text-[13px] font-normal text-gray-600 leading-relaxed space-y-4">
                <p className="hidden sm:block">
                  Rigidez, desconforto e limitações podem surgir silenciosamente
                  com o tempo.
                </p>
                <p>
                  MIX10 PRO reúne 10 ativos poderosos para apoiar
                  articulações, músculos e mobilidade no dia a dia.
                </p>
              </div>

              <div className="lg:hidden mt-2 w-full flex justify-center z-10 overflow-visible">
                <img
                  src="/hero.png?v=2"
                  alt="MIX10 PRO Suplemento"
                  className="h-auto w-[110%] max-w-[350px] sm:max-w-[470px] object-contain grayscale-0 relative transform translate-x-[10px]"
                />
              </div>

              <div className="mt-6 lg:mt-14 flex flex-col items-center sm:items-stretch sm:inline-flex w-full sm:w-max">
                <div className="mt-10 lg:mt-0 mb-0 lg:mb-8 flex w-fit justify-center gap-8 sm:gap-12 self-center order-2 lg:order-1">
                  <div className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="mb-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 text-[#F8F6F4] transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-800">
                      <Atom className="h-3 w-3" strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-bold leading-tight text-gray-700">
                      Fórmula
                      <br />
                      Avançada
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="mb-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 text-[#F8F6F4] transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-800">
                      <Award className="h-3 w-3" strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-bold leading-tight text-gray-700">
                      Qualidade
                      <br />
                      Premium
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="mb-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 text-[#F8F6F4] transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-800">
                      <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-bold leading-tight text-gray-700">
                      Confiança
                      <br />e Resultados
                    </span>
                  </div>
                </div>

                <div className="flex flex-col w-full order-1 lg:order-2">
                  <button
                    onClick={scrollToPricing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded bg-emerald-950 px-8 py-4 text-xs font-semibold tracking-widest uppercase text-white transition-all hover:bg-emerald-800 hover:shadow-lg"
                  >
                    SIM, QUERO QUALIDADE DE VIDA.{" "}
                    <span className="text-lg leading-none font-light">→</span>
                  </button>

                  <div className="mt-2.5 flex w-full items-center justify-center gap-1.5 text-[9px] text-gray-500 uppercase tracking-widest">
                    <Lock className="h-3 w-3" />
                    <span>Compra 100% segura</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Image/Composition */}
            <div className="hidden lg:flex relative lg:mt-0 items-center justify-center">
              <div className="relative flex w-full items-center justify-center">
                <img
                  src="/hero.png?v=2"
                  alt="MIX10 PRO Suplemento"
                  className="h-auto w-[140%] max-w-[640px] object-contain grayscale-0 relative transform -translate-x-[10px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section
        id="section-benefícios"
        className="relative bg-gray-50 py-24 lg:py-32 px-6 sm:px-8 lg:px-8 overflow-hidden"
        style={{ zIndex: 10 }}
      >
        {/* Background Image */}
        <div className="absolute bottom-0 right-0 w-full lg:w-auto pointer-events-none z-0 flex justify-center lg:justify-end">
          <div className="w-[85%] sm:w-[60%] md:w-[50%] lg:w-[552px] lg:mr-[2%] rounded-t-3xl overflow-hidden flex items-end">
            <img
              src="/problema.png"
              alt="Background"
              className="w-full h-auto object-cover origin-bottom mix-blend-multiply opacity-30 lg:opacity-100"
            />
          </div>
        </div>

        <div
          id="benefícios"
          className="relative z-10 mx-auto max-w-5xl text-center"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-emerald-600">
            O Problema Silencioso
          </span>
          <h2 className="mt-4 text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
            Aos poucos, seu corpo começa a impor limites.
          </h2>

          <div className="mt-6 mx-auto max-w-2xl text-[13px] font-normal text-gray-600 leading-relaxed text-center space-y-2">
            <p>
              Movimentos simples deixam de ser tão simples. O que antes passava despercebido começa a afetar a rotina todos os dias.
            </p>
          </div>

          <div className="mt-8 lg:mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6 relative z-10 pt-2 lg:pt-0">
            {[
              {
                icon: Bone,
                title: "DORES ARTICULARES",
                desc: "Movimentos simples começam a incomodar.",
              },
              {
                icon: BicepsFlexed,
                title: "CORPO TRAVADO",
                desc: "Rigidez ao acordar ou após esforço físico.",
              },
              {
                icon: Footprints,
                title: "DESCONFORTO AO ANDAR",
                desc: "Subir escadas ou caminhar já não parece igual.",
              },
              {
                icon: Lock,
                title: "SOBRECARGA DIÁRIA",
                desc: "O desgaste da rotina impacta músculos e articulações.",
              },
              {
                icon: BatteryWarning,
                title: "LIMITAÇÕES",
                desc: "Você começa a evitar movimentos que antes eram simples.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <item.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-xs font-semibold text-gray-900 uppercase tracking-wide text-center">
                  {item.title}
                </h3>
                <p className="text-center text-[13px] font-normal text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 lg:mt-24 text-center pb-8">
            <h3 className="text-xl sm:text-2xl font-light tracking-tight text-emerald-800">
              Conviver com dor todos os dias{" "}
              <span className="font-medium">não deveria ser normal.</span>
            </h3>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION (Dark Green) */}
      <section
        id="section-como-funciona"
        className="relative bg-[#0d2e1f] py-24 lg:py-24 overflow-visible"
        style={{ zIndex: 20 }}
      >
        <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
            <div
              id="como-funciona"
              className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left justify-center"
            >
              <span className="text-xs font-semibold tracking-widest uppercase text-emerald-400">
                COMO O MIX10 PRO AGE
              </span>
              <h2 className="mt-4 text-xl font-light tracking-tight text-white sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
                Quando a dor começa a fazer parte da rotina,{" "}
                <b className="font-bold italic">
                  apenas ignorar o problema não resolve.
                </b>
              </h2>
              <p className="mt-6 text-[13px] font-normal text-emerald-100/70 leading-relaxed">
                Mix10 Pro foi desenvolvido para quem busca uma abordagem mais completa para articulações, músculos e mobilidade.
              </p>

              <div className="mt-10 relative flex w-full items-start justify-center lg:justify-start">
                <button
                  onClick={scrollToPricing}
                  className="rounded border border-emerald-400/30 px-8 py-4 text-xs font-semibold tracking-widest uppercase leading-tight text-emerald-100 transition-all hover:bg-emerald-400/10 shrink-0 relative z-10"
                >
                  SAIBA MAIS <span className="ml-2 font-light">→</span>
                </button>
              </div>
            </div>

            <div className="mt-32 lg:mt-0 lg:col-span-7 relative z-10">
              <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-12 lg:pl-10">
                {[
                  {
                    icon: Footprints,
                    title: "MOVIMENTOS MAIS LEVES",
                    desc: "Mais liberdade para caminhar, subir escadas e se movimentar sem sentir o corpo pesando.",
                  },
                  {
                    icon: BicepsFlexed,
                    title: "CORPO MENOS TRAVADO",
                    desc: "Menos rigidez ao acordar ou após uma rotina intensa.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "MAIS ESTABILIDADE",
                    desc: "Mais segurança e firmeza nos movimentos do dia a dia.",
                  },
                  {
                    icon: Activity,
                    title: "MENOS IMPACTO DA ROTINA",
                    desc: "Sua rotina deixa de pesar tanto no corpo e nas articulações.",
                  },
                  {
                    icon: Bone,
                    title: "FORÇA E ESTRUTURA",
                    desc: "Vitaminas e minerais essenciais para sustentação muscular e óssea.",
                  },
                  {
                    icon: Sun,
                    title: "SUA ROTINA DE VOLTA",
                    desc: "Volte a viver seus dias sem sentir o corpo limitando seus movimentos.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex flex-row items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-900/50 text-emerald-400">
                      <item.icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white tracking-wide">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[13px] font-normal text-emerald-100/70 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INGREDIENTS SECTION */}
      <section
        id="section-ingredientes"
        className="relative bg-[#F8F9FA] py-20 lg:py-24 px-6 sm:px-8 lg:px-[120px] overflow-visible"
        style={{ zIndex: 30 }}
      >
        {/* Soft Emotional/Aspirational Background */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/[0.03] blur-[140px] rounded-full"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/[0.04] blur-[120px] rounded-full"></div>
        </div>

        <div id="ingredientes" className="relative z-10 mx-auto max-w-5xl">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start relative">
            {/* Left Col - Institucional Elegante */}
            <div className="lg:col-span-5 mb-10 lg:mb-0 lg:pr-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-[1px] bg-emerald-800/30"></div>
                <span className="text-xs font-semibold tracking-widest uppercase text-emerald-800">
                  CIÊNCIA DA FORMULAÇÃO
                </span>
              </div>
              <h2 className="mb-6 text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
                Uma combinação estratégica para suporte diário de verdade.
              </h2>
              <p className="mb-8 max-w-[340px] text-[13px] font-normal text-gray-600 leading-relaxed">
                Cada ingrediente foi selecionado por sua função específica dentro da fórmula, criando uma combinação pensada para apoiar articulações, músculos e mobilidade de forma complementar.
              </p>

              {/* Mini selo premium translúcido */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/50 px-4 py-2 backdrop-blur-sm relative z-10">
                <Award className="h-3 w-3 text-emerald-700" strokeWidth={1.5} />
                <span className="text-[9px] font-medium uppercase tracking-widest text-gray-500">
                  Fórmula Premium
                </span>
              </div>

              {/* Formulation Image */}
              <div className="mt-8 lg:mt-12 relative w-full flex flex-col lg:items-start items-center">
                <div className="w-full lg:w-80 max-w-md rounded-3xl overflow-hidden relative z-10 shadow-sm border border-gray-100">
                  <img
                    src="/laboratorio.png"
                    alt="Laboratório de formulação"
                    className="w-full h-full object-cover aspect-[16/10] lg:aspect-[4/3]"
                  />
                </div>
              </div>
            </div>

            {/* Right Col - Ingredient Highlights */}
            <div className="mt-8 lg:mt-0 lg:col-span-7 flex flex-col gap-6 relative z-10">
              {/* Ing 1 */}
              <div className="flex items-center gap-5">
                <div className="w-[80px] h-[100px] shrink-0 overflow-hidden bg-transparent rounded-lg">
                  <img
                    src="/curcumina.png"
                    alt="Cúrcuma + Curcumina"
                    className="h-full w-full object-cover transition-transform duration-[2s] hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium tracking-wide text-gray-900 mb-0.5">
                    Cúrcuma + Curcumina
                  </h3>
                  <p className="text-[13px] font-normal text-gray-500 leading-snug">
                    Resposta inflamatória e conforto articular.
                  </p>
                </div>
              </div>

              {/* Ing 2 */}
              <div className="flex items-center gap-5">
                <div className="w-[80px] h-[100px] shrink-0 overflow-hidden bg-transparent rounded-lg">
                  <img
                    src="/colageno.png"
                    alt="Colágeno Tipo II + Condroitina"
                    className="h-full w-full object-cover transition-transform duration-[2s] hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium tracking-wide text-gray-900 mb-0.5">
                    Colágeno Tipo II + Condroitina
                  </h3>
                  <p className="text-[13px] font-normal text-gray-500 leading-snug">
                    Suporte estrutural para as articulações.
                  </p>
                </div>
              </div>

              {/* Ing 3 */}
              <div className="flex items-center gap-5">
                <div className="w-[80px] h-[100px] shrink-0 overflow-hidden bg-transparent rounded-lg">
                  <img
                    src="/vitamina-d3.png"
                    alt="Vitamina D3 + K2 + Magnésio"
                    className="h-full w-full object-cover transition-transform duration-[2s] hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium tracking-wide text-gray-900 mb-0.5">
                    Vitamina D3 + K2 + Magnésio
                  </h3>
                  <p className="text-[13px] font-normal text-gray-500 leading-snug">
                    Mobilidade, função muscular e suporte ósseo.
                  </p>
                </div>
              </div>

              {/* End Phrase & Accordion (Full width under Right Col) */}
              <div className="mt-6 border-t border-gray-200/50 pt-8">
                <CompositionAccordion />

                <p className="mt-8 text-[13px] font-normal text-gray-400 italic max-w-[400px]">
                  E outros ativos estrategicamente combinados para complementar
                  a atuação da fórmula no suporte diário ao corpo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: BENEFÍCIOS PERCEBIDOS */}
      <section
        className="relative bg-[#0a1b14] py-[140px] px-6 sm:px-8 lg:px-[120px] overflow-hidden"
        style={{ zIndex: 40 }}
      >
        {/* Background Radial Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] lg:w-[120%] lg:h-[150%] bg-[radial-gradient(circle_at_center,_#0b7655_0%,_#0a1b14_70%)] opacity-80 pointer-events-none z-0"></div>

        <div className="relative z-10 mx-auto max-w-[1440px]">
          {/* Header */}
          <div className="text-center flex flex-col items-center mb-20 lg:mb-28 px-4">
            <h2 className="text-2xl font-light tracking-tight text-white sm:text-3xl lg:text-4xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
              O diferencial não está apenas nos ingredientes.
              <br className="hidden sm:block" />
              <span className="text-emerald-400 font-medium">
                Está em como eles trabalham juntos.
              </span>
            </h2>
            <p className="mt-6 max-w-[650px] text-[14px] font-normal text-emerald-100/80 leading-relaxed">
              10 ativos selecionados para atuar em diferentes áreas do corpo de
              forma complementar.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto gap-12 lg:gap-8 lg:items-center">
            {/* Left Col - 3 Benefits */}
            <div className="flex flex-col justify-center gap-6 lg:gap-8 lg:w-1/3 order-1 lg:order-1 relative lg:py-4">
              <div className="flex flex-row items-center justify-end gap-4 sm:gap-5 bg-white/5 border border-white/10 py-1.5 px-4 rounded-2xl backdrop-blur-md">
                <div className="flex flex-col text-right">
                  <h3 className="text-[11px] font-semibold tracking-widest text-white uppercase mb-0.5">
                    Mobilidade Articular
                  </h3>
                  <p className="text-[10px] font-medium text-emerald-400 tracking-wider uppercase mb-0">
                    Condroitina • Colágeno Tipo II
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800/40">
                  <Footprints
                    className="h-5 w-5 text-emerald-400"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <div className="flex flex-row items-center justify-end gap-4 sm:gap-5 bg-white/5 border border-white/10 py-1.5 px-4 rounded-2xl backdrop-blur-md lg:-translate-x-8">
                <div className="flex flex-col text-right">
                  <h3 className="text-[11px] font-semibold tracking-widest text-white uppercase mb-0.5">
                    Ação Anti-inflamatória
                  </h3>
                  <p className="text-[10px] font-medium text-emerald-400 tracking-wider uppercase mb-0">
                    Cúrcuma • MSM
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800/40">
                  <Activity
                    className="h-5 w-5 text-emerald-400"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <div className="flex flex-row items-center justify-end gap-4 sm:gap-5 bg-white/5 border border-white/10 py-1.5 px-4 rounded-2xl backdrop-blur-md">
                <div className="flex flex-col text-right">
                  <h3 className="text-[11px] font-semibold tracking-widest text-white uppercase mb-0.5">
                    Regeneração Muscular e Óssea
                  </h3>
                  <p className="text-[10px] font-medium text-emerald-400 tracking-wider uppercase mb-0">
                    Cálcio • Vitamina D3
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800/40">
                  <Bone
                    className="h-5 w-5 text-emerald-400"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </div>

            {/* Center Col - HUGE Product Image */}
            <div className="w-full lg:w-1/3 order-2 lg:order-2 flex justify-center py-6 lg:py-0 relative z-20 self-center">
              <div className="relative w-full max-w-[320px] scale-100 lg:scale-[1.35] transition-transform">
                <img
                  src="/caixa-frontal.png"
                  alt="Pote MIX10 PRO"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Right Col - 3 Benefits */}
            <div className="flex flex-col justify-center gap-6 lg:gap-8 lg:w-1/3 order-3 lg:order-3 relative lg:py-4">
              <div className="flex flex-row items-center justify-start gap-4 sm:gap-5 bg-white/5 border border-white/10 py-1.5 px-4 rounded-2xl backdrop-blur-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800/40">
                  <Atom
                    className="h-5 w-5 text-emerald-400"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="text-[11px] font-semibold tracking-widest text-white uppercase mb-0.5">
                    Absorção e Fixação de Cálcio
                  </h3>
                  <p className="text-[10px] font-medium text-emerald-400 tracking-wider uppercase mb-0">
                    Vitamina K2 MK-7
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-center justify-start gap-4 sm:gap-5 bg-white/5 border border-white/10 py-1.5 px-4 rounded-2xl backdrop-blur-md lg:translate-x-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800/40">
                  <Zap className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="text-[11px] font-semibold tracking-widest text-white uppercase mb-0.5">
                    Energia e Função Muscular
                  </h3>
                  <p className="text-[10px] font-medium text-emerald-400 tracking-wider uppercase mb-0">
                    Magnésio • Manganês
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-center justify-start gap-4 sm:gap-5 bg-white/5 border border-white/10 py-1.5 px-4 rounded-2xl backdrop-blur-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800/40">
                  <ShieldCheck
                    className="h-5 w-5 text-emerald-400"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="text-[11px] font-semibold tracking-widest text-white uppercase mb-0.5">
                    Imunidade e Proteção Antioxidante
                  </h3>
                  <p className="text-[10px] font-medium text-emerald-400 tracking-wider uppercase mb-0">
                    Vitamina C
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 lg:mt-32 flex justify-center relative z-20">
            <button
              onClick={scrollToPricing}
              className="inline-flex items-center justify-center rounded-sm bg-white px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase text-emerald-950 transition-all hover:bg-gray-100 focus:ring-2 focus:ring-white focus:outline-none"
            >
              QUERO EXPERIMENTAR O MIX10 PRO
            </button>
          </div>
        </div>
      </section>

      {/* SECTION EXPERIMENTE A NOVA FÓRMULA (LOTE ATUAL) */}
      <section className="bg-[#FAF9F7] pt-[100px] lg:pt-[140px] pb-10 px-6 sm:px-8 lg:px-[120px]">
        <div className="mx-auto max-w-6xl relative">
          {/* Oval glow atrás do frame */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-emerald-500/10 blur-[60px] rounded-[100%] pointer-events-none"></div>

          <div className="relative lg:grid lg:grid-cols-12 lg:gap-16 items-center bg-white rounded-[2rem] p-8 lg:p-16 shadow-none border-0">
            {/* LADO ESQUERDO */}
            <div className="hidden lg:flex lg:col-span-5 relative w-full flex-col items-center mb-16 lg:mb-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

              {/* Imagem Principal */}
              <div className="relative w-full aspect-square max-w-[240px] lg:max-w-[300px] flex items-center justify-center mb-6 z-10">
                <img
                  src={PRODUCT_IMAGES[activeImageIndex]}
                  alt={`MIX10 PRO View ${activeImageIndex + 1}`}
                  className="w-full h-full object-contain  transition-all duration-500"
                />

                {/* Controles do Carrossel (Setinhas internas minúsculas) */}
                <div className="absolute bottom-2 right-2 flex gap-1.5 z-20">
                  <button
                    onClick={prevImage}
                    className="p-1 rounded-full bg-white/80 backdrop-blur border border-gray-100 text-gray-500 hover:text-emerald-700 hover:bg-white transition-colors shadow-sm"
                  >
                    <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="p-1 rounded-full bg-white/80 backdrop-blur border border-gray-100 text-gray-500 hover:text-emerald-700 hover:bg-white transition-colors shadow-sm"
                  >
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Miniaturas */}
              <div className="flex items-center justify-center relative z-10">
                <div className="flex gap-2">
                  {PRODUCT_IMAGES.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-[60px] h-[60px] md:w-[72px] md:h-[72px] rounded-md overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx
                          ? "border-emerald-600 shadow-sm"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LADO DIREITO */}
            <div className="lg:col-span-7 flex flex-col justify-center items-center text-center lg:items-start lg:text-left mx-auto w-full">
              <span className="inline-block mb-6 text-xs font-semibold tracking-[0.2em] uppercase text-emerald-800/80">
                Lançamento Condicionado
              </span>

              <h2 className="mb-6 text-lg font-light tracking-tight text-gray-900 sm:text-3xl lg:text-4xl leading-[1.15] sm:leading-[1.1] lg:leading-[1.15]">
                Volte a fazer o que seu corpo vem impedindo você de aproveitar.
              </h2>

              <p className="mb-8 text-[13px] font-normal text-gray-600 leading-relaxed max-w-lg">
                Fórmula premium desenvolvida para quem quer voltar a se
                movimentar com mais liberdade, leveza e menos limitações no dia
                a dia.
              </p>

              <div className="flex flex-col gap-2 mb-8 self-center lg:self-start w-full sm:w-max px-4 sm:px-0">
                <div className="flex items-center justify-start gap-2 sm:gap-3 text-left w-full">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-gray-700 text-left">
                    Seu corpo mais leve na rotina
                  </span>
                </div>
                <div className="flex items-center justify-start gap-2 sm:gap-3 text-left w-full">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-gray-700 text-left">
                    Menos impacto do desgaste diário
                  </span>
                </div>
                <div className="flex items-center justify-start gap-2 sm:gap-3 text-left w-full">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-gray-700 text-left">
                    Mobilidade e movimentos mais livres
                  </span>
                </div>
                <div className="flex items-center justify-start gap-2 sm:gap-3 text-left w-full">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] text-gray-700 text-left">
                    Fórmula premium de uso contínuo
                  </span>
                </div>
              </div>

              {/* Mobile Carousel Copy */}
              <div className="lg:hidden relative w-full flex flex-col items-center my-8 z-10 text-center items-center content-center max-w-[240px] align-middle self-center justify-self-center mx-auto">
                {/* Imagem Principal */}
                <div className="relative w-full aspect-square max-w-[240px] flex items-center justify-center mb-6 z-10 text-center">
                  <img
                    src={PRODUCT_IMAGES[activeImageIndex]}
                    alt="MIX10 PRO"
                    className="w-[80%] mx-auto h-full object-contain  transition-all duration-500"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1.5 z-20">
                    <button
                      onClick={prevImage}
                      className="p-1 rounded-full bg-white/80 backdrop-blur border border-gray-100 text-gray-500 hover:text-emerald-700 shadow-sm"
                    >
                      <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="p-1 rounded-full bg-white/80 backdrop-blur border border-gray-100 text-gray-500 hover:text-emerald-700 shadow-sm"
                    >
                      <ArrowRight className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {/* Miniaturas */}
                <div className="flex items-center justify-center relative z-10 w-full">
                  <div className="flex gap-2 mx-auto justify-center">
                    {PRODUCT_IMAGES.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-[60px] h-[60px] rounded-md overflow-hidden border-2 transition-all ${activeImageIndex === idx ? "border-emerald-600 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"}`}
                      >
                        <img
                          src={imgUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-10 flex flex-col gap-1 items-center lg:items-start text-center lg:text-left">
                <div className="text-gray-400 text-xs font-light">
                  De: <span className="line-through">R$149,90</span>
                </div>
                <div className="text-gray-900 text-3xl sm:text-4xl font-light tracking-tight">
                  Por: R$109,90
                </div>
                <span className="mt-2 text-[10px] text-emerald-700 uppercase tracking-widest font-medium">
                  Condição especial válida para o lote atual.
                </span>
              </div>

              <div>
                <button
                  onClick={scrollToPricing}
                  className="w-full sm:w-max bg-[#0d2e1f] text-white px-8 py-4 rounded text-xs font-semibold tracking-widest uppercase hover:bg-emerald-800 transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  Quero meu MIX10 PRO
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: PARA QUEM */}
      <section className="bg-[#FAF9F7] pb-[140px] pt-[60px] lg:pt-[80px] px-6 sm:px-8 lg:px-[120px]">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-16 items-center">
            {/* Left Column Image */}
            <div className="lg:col-span-5 w-full relative flex justify-center lg:justify-end">
              {/* Very subtle glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-emerald-900/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
              <img
                src="/casalcaixa.png"
                alt="Rotina leve e ativa"
                className="relative z-10 w-full max-w-[380px] lg:max-w-full h-auto object-contain mx-auto lg:mx-0 rounded-2xl"
              />
            </div>

            {/* Right Column Copy */}
            <div className="lg:col-span-6 lg:col-start-7 flex flex-col justify-center lg:pl-4">
              <div className="mb-8 items-center flex gap-3">
                <span className="text-emerald-800 text-xs font-semibold tracking-widest uppercase leading-tight">
                  QUALIDADE DE VIDA
                </span>
                <div className="w-6 h-[1px] bg-emerald-800/30"></div>
              </div>

              <h2 className="mb-8 text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
                A melhor sensação é voltar a confiar no próprio corpo.
              </h2>

              <p className="max-w-[400px] mb-10 text-[13px] font-normal text-gray-600 leading-relaxed">
                Porque o problema não é apenas sentir dor.
                <br />É começar a evitar caminhadas, deixar de brincar com os netos, recusar passeios, ter receio de subir escadas ou perceber que atividades simples estão ficando mais difíceis.
              </p>

              <div className="flex flex-col gap-2 w-full max-w-[420px]">
                <p className="text-xs uppercase tracking-widest text-emerald-800 font-semibold mb-2">
                  Para quem:
                </p>
                {[
                  "Já sente o corpo mais rígido na rotina",
                  "Quer voltar a se movimentar com mais liberdade",
                  "Não quer aceitar dores como algo normal",
                  "Busca mais disposição para o dia a dia",
                  "Quer continuar ativo sem sentir o corpo limitando seus movimentos",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 py-1">
                    <Check
                      className="h-4 w-4 text-emerald-600 shrink-0"
                      strokeWidth={1.5}
                    />
                    <span className="text-gray-700 text-[13px] font-normal tracking-wide">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-14 pt-8 border-t border-gray-200/50">
                <p className="text-[13px] font-normal text-gray-600 leading-relaxed">
                  "Continuar ativo é diferente de continuar suportando dor."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: DEPOIMENTOS */}
      <TestimonialsSection />

      {/* SECTION PRODUÇÃO CONTROLADA */}
      <section className="bg-[#07110F] py-[200px] px-6 sm:px-8 lg:px-[120px]">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-24">
            <span className="text-xs font-semibold tracking-widest uppercase leading-tight text-emerald-500 mb-8 block">
              PRODUÇÃO CONTROLADA
            </span>
            <h2 className="mb-8 text-xl font-light tracking-tight text-white sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
                Produção controlada.
                <br />
                <span className="italic">Eficácia em cada detalhe.</span>
            </h2>
            <p className="max-w-[600px] mx-auto text-[13px] font-normal text-emerald-100/70 leading-relaxed">
              Consistência, pureza e padrão em cada lote. Nossa produção segue
              processos minuciosos para garantir que cada ingrediente mantenha
              sua eficácia.
            </p>
          </div>

          <div className="relative w-full aspect-square md:aspect-[21/9] max-h-[600px] mb-32 overflow-hidden rounded-2xl">
            <img
              src="/pills.png"
              alt="Produção premium"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#07110F]/60 via-[#07110F]/10 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 lg:max-w-5xl lg:mx-auto">
            <div className="flex flex-col items-center text-center p-6 md:border-r border-emerald-900/30">
              <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-emerald-800/40">
                <Microscope
                  className="h-8 w-8 text-emerald-400"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-sm font-medium text-white tracking-wide uppercase mb-4 text-emerald-50">
                Produção Controlada
              </h3>
              <p className="text-[13px] font-normal text-emerald-100/70 leading-relaxed">
                Padrão consistente e excelência mantida em cada lote.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 md:border-r border-emerald-900/30">
              <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-emerald-800/40">
                <TestTubeDiagonal
                  className="h-8 w-8 text-emerald-400"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-sm font-medium text-white tracking-wide uppercase mb-4 text-emerald-50">
                Ingredientes Selecionados
              </h3>
              <p className="text-[13px] font-normal text-emerald-100/70 leading-relaxed">
                Matérias-primas escolhidas com rigor para pureza absoluta.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-emerald-800/40">
                <Award className="h-8 w-8 text-emerald-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-medium text-white tracking-wide uppercase mb-4 text-emerald-50">
                Fórmula Premium
              </h3>
              <p className="text-[13px] font-normal text-emerald-100/70 leading-relaxed">
                Tecnologia nutricional pensada para uso contínuo.
              </p>
            </div>
          </div>

          <div className="mt-24 pt-12 border-t border-emerald-900/30">
            <p className="text-[11px] font-light tracking-widest text-emerald-500/70 uppercase">
              "Qualidade acima de volume."
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION (SECTION 11) */}
      <section className="bg-[#F8F6F4] border-y border-gray-100 py-24 lg:py-32 relative">
        <div
          id="pricing"
          className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-8 text-center scroll-mt-[96px]"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-emerald-600">
            PREÇO EXCLUSIVO DE LANÇAMENTO
          </span>
          <h2 className="mt-6 text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.15] sm:leading-[1.1] lg:leading-[1.15]">
            O melhor momento para começar é antes que a dor faça mais escolhas por você.
          </h2>
          <p className="mt-3 text-xs text-gray-500 font-normal">
            Garanta sua caixa abaixo e dê o primeiro passo hoje.
          </p>

          <div className="mt-16 mx-auto max-w-md">
            {/* Tier 1 */}
            <div className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-10 shadow-lg transition-transform hover:scale-[1.02]">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-900">
                1 Caixa
              </h3>
              <p className="mt-2 items-baseline text-[10px] font-light text-gray-500 uppercase tracking-widest">
                Tratamento para 30 dias • Início Imediato
              </p>
              <div className="mt-6 flex h-44 items-center justify-center">
                <img
                  src="/kit-1.webp"
                  alt="1 Caixa de MIX10 PRO"
                  className="h-full object-contain rounded-lg scale-[1.15]"
                />
              </div>
              <div className="mt-6 flex flex-col items-center">
                <p className="text-sm text-gray-400 font-light drop-shadow-sm line-through">
                  R$ 149,90
                </p>
                <p className="text-4xl font-light tracking-tight text-gray-900 leading-none mt-1">
                  R$ 109,90
                </p>
                <p className="mt-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                  Até 3x de R$ 38,85 no cartão.
                </p>
              </div>
              <button
                onClick={() => openCheckout(1, 'OfferBottom')}
                className="mt-6 block rounded-full bg-[#0d2e1f] px-6 py-3.5 text-center text-[11px] sm:text-[12px] font-semibold tracking-wide uppercase text-white hover:bg-emerald-800 transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none w-full shadow-md cursor-pointer"
              >
                SIM, QUERO QUALIDADE DE VIDA
              </button>
            </div>
          </div>

          {/* Trust Badges Minimalist */}
          <div className="mt-20 pt-16 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-y-6 gap-x-2 sm:gap-6 lg:gap-12">
              <div className="w-[30%] sm:w-auto flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                <div className="mx-auto mb-2 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ShieldCheck
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase leading-tight text-gray-600">
                  Compra
                  <br />
                  100% segura
                </span>
              </div>
              <div className="w-[30%] sm:w-auto flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                <div className="mx-auto mb-2 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CreditCard
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase leading-tight text-gray-600">
                  Parcelamento
                  <br />
                  em até 10x
                </span>
              </div>
              <div className="w-[30%] sm:w-auto flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                <div className="mx-auto mb-2 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase leading-tight text-gray-600">
                  Envio para
                  <br />
                  todo o Brasil
                </span>
              </div>
              <div className="w-[30%] sm:w-auto flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                <div className="mx-auto mb-2 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Headset
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase leading-tight text-gray-600">
                  Suporte
                  <br />
                  especializado
                </span>
              </div>
              <div className="w-[30%] sm:w-auto flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
                <div className="mx-auto mb-2 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase leading-tight text-gray-600">
                  Satisfação
                  <br />
                  garantida
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 12: POR QUE É DIFERENTE? */}
      {/* SECTION 11: O DIFERENCIAL MIX10 PRO */}
      <section className="bg-white py-[120px] px-6 sm:px-8 lg:px-[120px]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <span className="text-xs font-semibold tracking-widest uppercase leading-tight text-emerald-700 mb-6 block">
              O DIFERENCIAL MIX10 PRO
            </span>
            <h2 className="mb-8 text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
              Uma fórmula pensada para ir
              <br className="hidden sm:block" />
              <span className="italic">além do básico.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:gap-0 lg:rounded-[40px] lg:overflow-hidden lg:shadow-2xl lg:shadow-emerald-900/5">
            {/* Esquerda: Com MIX10 PRO */}
            <div className="bg-[#e8f2ea] p-6 lg:p-10 flex flex-col items-center max-md:rounded-t-[40px] relative">
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-950 mb-4 bg-emerald-100/80 px-5 py-2 rounded-full">
                Com MIX10 PRO
              </span>

              <div className="w-[180px] h-[240px] mb-12 relative flex items-center justify-center bg-white shadow-2xl shadow-emerald-900/20 rounded-2xl overflow-hidden border border-emerald-100 mt-6">
                <img
                  src="/commix10.webp"
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="MIX10 PRO"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-white font-bold tracking-widest text-xl">
                    MIX10 PRO
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full">
                {[
                  {
                    text: "Fórmula desenvolvida para agir em conjunto — não apenas em um único ponto do corpo.",
                  },
                  {
                    text: "Atua sobre articulações, músculos e mobilidade ao mesmo tempo.",
                  },
                  {
                    text: "Ingredientes selecionados para melhor absorção e uso contínuo.",
                  },
                  {
                    text: "Desenvolvido para quem já sente os impactos da rotina no corpo.",
                  },
                  {
                    text: "Mais liberdade nos movimentos sem depender de soluções superficiais.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 bg-white/80 p-5 rounded-2xl shadow-sm border border-emerald-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-[13px] font-normal text-emerald-950 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Direita: Sem MIX10 PRO */}
            <div className="bg-[#f5f5f5] p-6 lg:p-10 flex flex-col items-center border-t border-gray-200 md:border-t-0 md:border-l border-white/50 max-md:rounded-b-[40px] relative">
              {/* VS Badge in center */}
              <div className="absolute left-1/2 -ml-7 -top-7 md:top-[160px] md:left-0 md:-ml-7 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xl z-20 border-[4px] border-white max-md:hidden">
                VS
              </div>

              <span className="text-[11px] font-bold tracking-widest uppercase text-gray-600 mb-4 bg-gray-200/80 px-5 py-2 rounded-full">
                Outros Suplementos
              </span>

              <div className="w-[180px] h-[240px] mb-12 relative flex items-center justify-center bg-white shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden border border-gray-100 mt-6 scale-[0.95]">
                <img
                  src="/semmix10.png"
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="Outro Produto Genérico"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-100/30 to-transparent"></div>
              </div>

              <div className="flex flex-col gap-4 w-full">
                {[
                  {
                    text: "Fórmulas isoladas com foco limitado.",
                  },
                  {
                    text: "Atuação parcial sem abordagem completa do desgaste diário.",
                  },
                  {
                    text: "Ingredientes comuns com menor eficiência de absorção.",
                  },
                  {
                    text: "Resultados inconsistentes ao longo do uso.",
                  },
                  {
                    text: "Soluções temporárias sem continuidade real.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 bg-white/60 p-5 rounded-2xl shadow-sm border border-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center shrink-0 shadow-md shadow-red-400/20">
                      <X className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-[13px] font-normal text-gray-600 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL (SECTION 14) */}
      <section className="bg-[#0d2e1f] py-32 text-center text-white">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-8">
          <h2 className="text-xl font-light tracking-tight text-white sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
            <span className="text-white">Mais movimento.</span>
            <br />
            <span className="text-white">Mais conforto.</span>
            <br />
            <span className="text-emerald-400">Mais qualidade de vida.</span>
          </h2>
          <p className="mt-8 text-[13px] font-normal text-emerald-100/70 leading-relaxed">
            Transforme o cuidado com o seu corpo em parte da sua rotina.
          </p>
          <button
            onClick={scrollToPricing}
            className="mt-12 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-xs font-semibold tracking-widest uppercase text-[#0d2e1f] transition-all hover:bg-gray-100 hover:scale-105 focus:ring-2 focus:ring-white focus:outline-none shadow-lg"
          >
            QUERO EXPERIMENTAR MIX10 PRO
          </button>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="section-faq" className="bg-[#F8F6F4] py-[140px]">
        <div className="mx-auto max-w-2xl px-6 sm:px-8">
          <div id="faq" className="text-center mb-16">
            <h2 className="mb-6 text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
              O que você <span className="italic">precisa saber</span>
            </h2>
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-widest">
              Perguntas sobre o MIX10 PRO
            </p>
          </div>
          <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100">
            {ACCORDION_DATA.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
      <Checkout
        isOpen={!!checkoutPlan}
        onClose={closeCheckout}
        plan={checkoutPlan}
        onPlanChange={(id) =>
          setCheckoutPlan(APP_PLANS[id as keyof typeof APP_PLANS])
        }
        lpVersion={getLpVersion()}
        initialQuantity={checkoutQuantity}
      />

      <ExitIntentPopup isCheckoutOpen={!!checkoutPlan} />

      {/* Floating WhatsApp Bubble */}
      <a
        href="https://wa.me/5511934924155?text=Ol%C3%A1%2C%20visitei%20o%20site%20do%20MIX10%20PRO%20e%20gostaria%20de%20tirar%20algumas%20d%C3%BAvidas."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-11 h-11 md:w-12 md:h-12 bg-[#25D366] text-white rounded-full shadow-md hover:shadow-lg hover:bg-[#1EBE5D] transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Falar no WhatsApp"
      >
        <span className="absolute inset-x-0 inset-y-0 rounded-full bg-[#25D366]/30 animate-ping opacity-75 pointer-events-none group-hover:hidden" />
        <svg
          viewBox="0 0 24 24"
          className="w-5.5 h-5.5 md:w-6 md:h-6 relative z-10 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.714 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
        </svg>
      </a>

      {isInternalMode && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-slate-900/95 px-3 py-1.5 text-[11px] font-medium text-emerald-400 shadow-lg backdrop-blur-md transition-all duration-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>Modo Interno Ativo</span>
        </div>
      )}
    </div>
  );
}

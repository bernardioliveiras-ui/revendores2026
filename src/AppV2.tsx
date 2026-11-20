import React, { useState, useRef, useEffect } from "react";
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

const CAROUSEL_VIDEOS = [
  { id: 0, src: "/dp-isabel.mp4" },
  { id: 1, src: "/dp-mariasocorro.mp4" },
  { id: 2, src: "/dp-sra.mp4" },
  { id: 3, src: "/dp-xangrila.mp4" },
];

const EXTENDED_VIDEOS = [
  ...CAROUSEL_VIDEOS,
  ...CAROUSEL_VIDEOS,
  ...CAROUSEL_VIDEOS,
];

function VideoCard({
  src,
  isActive,
  isVisible,
  position,
}: {
  src: string;
  isActive: boolean;
  isVisible: boolean;
  position: "left" | "right";
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsMuted(true);
    video.muted = true;

    if (isActive) {
      try {
        video.currentTime = 0;
      } catch (e) {
        console.log("Error resetting time:", e);
      }
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Autoplay blocked:", err));
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isVisible) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch (e) {
        console.log("Error resetting time:", e);
      }
      setIsPlaying(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isVisible) {
            video.muted = !isActive || isMuted;
            video.play()
              .then(() => setIsPlaying(true))
              .catch((err) => console.log("Autoplay blocked:", err));
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isActive, isVisible, isMuted]);

  const handlePlayClick = (e?: React.MouseEvent) => {
    if (!isActive) return;
    if (e) e.stopPropagation();
    
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      try {
        video.currentTime = 0;
      } catch (err) {
        console.log("Error resetting time:", err);
      }
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Play failed:", err));
    } else {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log("Play failed:", err));
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);

    if (!newMuted) {
      try {
        video.currentTime = 0;
      } catch (err) {
        console.log("Error resetting time:", err);
      }
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Play failed:", err));
    }
  };

  const maskStyle: React.CSSProperties = !isActive
    ? {
        maskImage: position === "left"
          ? "linear-gradient(to right, transparent 0%, black 85%)"
          : "linear-gradient(to left, transparent 0%, black 85%)",
        WebkitMaskImage: position === "left"
          ? "linear-gradient(to right, transparent 0%, black 85%)"
          : "linear-gradient(to left, transparent 0%, black 85%)",
      }
    : {};

  return (
    <div
      ref={containerRef}
      style={maskStyle}
      className={`relative rounded-2xl overflow-hidden aspect-[9/16] w-full shadow-lg bg-emerald-950/40 border transition-all duration-500 group flex flex-col justify-between ${
        isActive ? "border-emerald-500/30" : "border-transparent"
      }`}
    >
      <video
        ref={videoRef}
        src={src}
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover z-0 ${
          isActive ? "cursor-pointer" : "cursor-default"
        }`}
        playsInline
        loop={!isActive}
        muted={!isActive || isMuted}
        onClick={() => {
          if (isActive) handlePlayClick();
        }}
        onEnded={() => {
          if (isActive) {
            const video = videoRef.current;
            if (video) {
              video.pause();
              try {
                video.currentTime = 0;
              } catch (e) {
                console.log("Error resetting time:", e);
              }
              setIsPlaying(false);
            }
          }
        }}
      />

      {/* Unmute pill */}
      {isActive && isMuted && (
        <button
          onClick={toggleMute}
          className="absolute top-3.5 left-3.5 z-20 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-full px-3 py-1.5 text-[9px] uppercase tracking-widest shadow-md flex items-center gap-1 transition-all cursor-pointer border border-emerald-400"
        >
          <VolumeX className="w-3 h-3" />
          <span>Ativar Som</span>
        </button>
      )}

      {/* Play button overlay */}
      {isActive && !isPlaying && (
        <div
          onClick={() => handlePlayClick()}
          className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center transition-opacity duration-300 z-10 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110 mb-2 border border-white/10">
            <Play className="w-5 h-5 fill-current ml-1" />
          </div>
          <span className="text-[9px] font-bold tracking-widest text-white uppercase bg-emerald-950/90 px-3 py-1 rounded-full">
            Ver Depoimento
          </span>
        </div>
      )}

      {/* Control pill */}
      {isActive && isPlaying && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => handlePlayClick(e)}
            className="bg-black/60 hover:bg-black/85 text-white rounded-full p-2 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => toggleMute(e)}
            className="bg-black/60 hover:bg-black/85 text-white rounded-full p-2 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

function TestimonialsSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTrackIndex, setActiveTrackIndex] = useState(5); // Start at index 5 (video 1)
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  // Resize listener to set the correct width for the video carousel cards
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle infinite wrap-around logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTrackIndex >= 8) {
        setIsTransitioning(false);
        setActiveTrackIndex(activeTrackIndex - 4); // Loop back symmetrically by subtracting length 4
      } else if (activeTrackIndex <= 3) {
        setIsTransitioning(false);
        setActiveTrackIndex(activeTrackIndex + 4); // Loop forward symmetrically by adding length 4
      }
    }, 500); // Wait for transition duration

    return () => clearTimeout(timer);
  }, [activeTrackIndex]);

  // Re-enable transition animation on the next animation frame
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  const handleNextVideo = () => {
    if (!isTransitioning) return;
    setActiveTrackIndex((prev) => prev + 1);
  };

  const handlePrevVideo = () => {
    if (!isTransitioning) return;
    setActiveTrackIndex((prev) => prev - 1);
  };

  const handleCardClick = (idx: number) => {
    if (!isTransitioning) return;
    if (idx !== activeTrackIndex) {
      setActiveTrackIndex(idx);
    }
  };

  const cardWidth = isMobile ? 230 : 220; // 220px on desktop to prevent grid column clipping
  const gap = isMobile ? 16 : 20; // 20px gap on desktop
  const transitionStyle = isTransitioning ? "transform 500ms ease-out" : "none";

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
              Histórias Verdadeiras
            </span>
            <h2 className="mb-6 text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-[45px] leading-[1.1]">
              Veja o que clientes <br />
              <span className="italic text-emerald-400 font-normal">estão compartilhando</span>
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

          {/* Right Block (Video Player / Carousel) */}
          <div className="lg:col-span-7 w-full relative overflow-visible select-none py-4 px-1 flex flex-col items-center">
            
            {/* Slider track viewport */}
            <div className="relative w-full max-w-[740px] mx-auto overflow-hidden py-12 rounded-2xl">
              
              {/* Left and Right Nav Buttons */}
              <button
                type="button"
                onClick={handlePrevVideo}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-emerald-950/85 hover:bg-emerald-800 text-white flex items-center justify-center shadow-lg border border-emerald-500/25 transition-all active:scale-95 cursor-pointer z-30 animate-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNextVideo}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-emerald-950/85 hover:bg-emerald-800 text-white flex items-center justify-center shadow-lg border border-emerald-500/25 transition-all active:scale-95 cursor-pointer z-30 animate-none"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div
                className="flex"
                style={{
                  gap: `${gap}px`,
                  transition: transitionStyle,
                  transform: `translateX(calc(50% - ${cardWidth / 2}px - (${activeTrackIndex} * ${
                    cardWidth + gap
                  }px)))`,
                }}
              >
                {EXTENDED_VIDEOS.map((video, idx) => {
                  const isActive = idx === activeTrackIndex;
                  const isVisible = idx === activeTrackIndex || idx === activeTrackIndex - 1 || idx === activeTrackIndex + 1;
                  const position = idx < activeTrackIndex ? "left" : "right";
                  return (
                    <div
                      key={idx}
                      onClick={() => handleCardClick(idx)}
                      style={{ width: `${cardWidth}px` }}
                      className={`shrink-0 transition-all duration-500 ease-out origin-center ${
                        isActive
                          ? "scale-115 md:scale-120 opacity-100 z-10 cursor-default animate-none"
                          : "scale-[0.92] opacity-65 z-0 cursor-pointer"
                      }`}
                    >
                      <VideoCard
                        src={video.src}
                        isActive={isActive}
                        isVisible={isVisible}
                        position={position}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 mt-5">
              {CAROUSEL_VIDEOS.map((video) => {
                const currentVideoId = EXTENDED_VIDEOS[activeTrackIndex].id;
                const isDotActive = video.id === currentVideoId;
                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => {
                      setActiveTrackIndex(video.id + 4);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isDotActive ? "bg-emerald-400 w-4" : "bg-emerald-800/60"
                    }`}
                  />
                );
              })}
            </div>
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

const PricingGrid: React.FC<{
  onBuy: (id: number, origin: "OfferTop" | "OfferBottom", quantity?: number) => void;
  origin: "OfferTop" | "OfferBottom";
}> = ({ onBuy, origin }) => {
  return (
    <div className="mt-16 mx-auto max-w-md items-stretch">
      {/* Kit 1 */}
      <div className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-8 lg:p-10 shadow-lg transition-transform hover:scale-[1.02] justify-between">
        <div>
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
        </div>

        <div className="mt-6">
          <div className="flex flex-col items-center">
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
            onClick={() => onBuy(1, origin)}
            className="mt-6 block rounded-full bg-[#0d2e1f] px-6 py-3.5 text-center text-[11px] sm:text-[12px] font-semibold tracking-wide uppercase text-white hover:bg-emerald-800 transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none w-full shadow-md cursor-pointer"
          >
            Quero experimentar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getLpVersion = () => 'v2';

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
  const lastCheckoutOrigin = React.useRef<'OfferTop' | 'OfferBottom' | undefined>(undefined);

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
            lastCheckoutOrigin.current = undefined;
            trackAddToCart(parsedPlanId, undefined, urlQty || 1);
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
      lastCheckoutOrigin.current = origin;
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
                Mais conforto. Mais mobilidade.
                <br />
                <span className="text-emerald-700 font-medium">
                  Mais qualidade de vida.
                </span>
              </h1>

              <div className="mt-4 max-w-xl text-[13px] font-normal text-gray-600 leading-relaxed space-y-4">
                <p>
                  Sua rotina de volta, com movimentos livres e mais bem-estar no dia a dia.
                </p>
                <p>
                  MIX10 PRO reúne 10 ativos premium em uma fórmula de cuidado contínuo para apoiar articulações, músculos e mobilidade.
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
                    Quero experimentar{" "}
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

            {/* BARRA DE CONFIANÇA */}
      <section className="bg-[#0b262c] text-white py-6 border-y border-emerald-950 px-6 sm:px-8">
        <div className="mx-auto max-w-5xl flex flex-wrap justify-between items-center gap-y-4 gap-x-4 text-[11px] sm:text-xs font-semibold tracking-widest uppercase">
          <div className="flex items-center gap-2.5 mx-auto md:mx-0">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" strokeWidth={1.5} />
            <span>Compra Segura</span>
          </div>
          <div className="flex items-center gap-2.5 mx-auto md:mx-0">
            <Truck className="h-5 w-5 text-emerald-400 shrink-0" strokeWidth={1.5} />
            <span>Envio para todo o Brasil</span>
          </div>
          <div className="flex items-center gap-2.5 mx-auto md:mx-0">
            <Leaf className="h-5 w-5 text-emerald-400 shrink-0" strokeWidth={1.5} />
            <span>Produto sem glúten</span>
          </div>
          <div className="flex items-center gap-2.5 mx-auto md:mx-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" strokeWidth={1.5} />
            <span>Produto sem lactose</span>
          </div>
          <div className="flex items-center gap-2.5 mx-auto md:mx-0">
            <Activity className="h-5 w-5 text-emerald-400 shrink-0" strokeWidth={1.5} />
            <span>1 Cápsula ao dia</span>
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <TestimonialsSection />

      {/* PARA QUEM FOI DESENVOLVIDO */}
      <section className="bg-white py-20 lg:py-24 px-6 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-emerald-700 block mb-3">
            Para homens e mulheres acima dos 40 anos
          </span>
          <h2 className="text-2xl font-light tracking-tight text-gray-900 sm:text-3xl lg:text-4xl leading-[1.2]">
            Para quem o <span className="text-emerald-700 font-semibold">MIX10 PRO</span> foi desenvolvido?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-[13px] font-normal text-gray-500 leading-relaxed">
            Desenvolvido cientificamente para apoiar a saúde articular, muscular e óssea nas diferentes fases da vida.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Rotina ativa",
                desc: "Quem deseja manter uma rotina ativa e continuar praticando esportes ou caminhadas sem preocupações.",
                icon: Activity,
              },
              {
                title: "Conforto diário",
                desc: "Quem busca mais conforto no dia a dia, minimizando os desconfortos provocados pelo desgaste natural.",
                icon: Heart,
              },
              {
                title: "Qualidade de vida",
                desc: "Quem valoriza mobilidade e qualidade de vida para realizar as atividades mais simples do cotidiano.",
                icon: Sun,
              },
              {
                title: "Suporte completo",
                desc: "Quem quer cuidar e preservar a integridade de articulações, músculos e estrutura óssea de forma integral.",
                icon: Bone,
              },
            ].map((card, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl bg-gray-50 p-6 border border-gray-100/60 shadow-sm hover:shadow-md transition-all text-center">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <card.icon className="h-5.5 w-5.5" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2.5 text-sm font-semibold text-gray-900 tracking-wide uppercase">
                  {card.title}
                </h3>
                <p className="text-[13px] font-normal text-gray-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS PRINCIPAIS */}
      <section id="section-benefícios" className="bg-gray-50 py-20 lg:py-24 px-6 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-emerald-700 block mb-3">
            Benefícios
          </span>
          <h2 className="text-2xl font-light tracking-tight text-gray-900 sm:text-3xl lg:text-4xl leading-[1.2]">
            Benefícios pensados para o <span className="text-emerald-700 font-semibold">seu corpo</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-[13px] font-normal text-gray-500 leading-relaxed">
            Uma abordagem completa para apoiar a sua rotina com leveza e movimento.
          </p>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
            {[
              { title: "Mobilidade", desc: "Suporte para movimentos livres.", icon: Footprints },
              { title: "Conforto", desc: "Corpo mais leve na rotina diária.", icon: ShieldCheck },
              { title: "Movimento", desc: "Mais flexibilidade e menos rigidez.", icon: Activity },
              { title: "Qualidade de vida", desc: "Mais energia para o seu dia.", icon: Heart },
              { title: "Cuidado diário", desc: "Nutrição e proteção contínuas.", icon: Award },
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center col-span-1 max-sm:col-span-2">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <benefit.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="mb-1 text-xs font-bold text-gray-900 uppercase tracking-wider">
                  {benefit.title}
                </h3>
                <p className="text-[11px] text-gray-500 font-normal leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIMEIRA OFERTA */}
      <section id="pricing" className="bg-white py-20 lg:py-24 border-y border-gray-100 scroll-mt-[96px]">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-8 text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-emerald-700 block mb-3">
            Oferta Especial
          </span>
          <h2 className="text-2xl font-light tracking-tight text-gray-900 sm:text-3xl lg:text-4xl leading-[1.2]">
            Comece sua rotina de cuidado contínuo hoje
          </h2>
          <p className="mt-3 text-xs text-gray-500 font-normal">
            Selecione a opção ideal e sinta a diferença no seu dia a dia.
          </p>

          <PricingGrid onBuy={openCheckout} origin="OfferTop" />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="section-como-funciona" className="relative bg-[#0d2e1f] py-20 lg:py-24 px-6 sm:px-8 lg:px-8">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
            <div id="como-funciona" className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left justify-center mb-12 lg:mb-0">
              <span className="text-xs font-semibold tracking-widest uppercase text-emerald-400">
                Rotina de Cuidado
              </span>
              <h2 className="mt-4 text-xl font-light tracking-tight text-white sm:text-2xl lg:text-3xl leading-[1.2]">
                O corpo responde à constância e à rotina de cuidado.
              </h2>
              <p className="mt-6 text-[13px] font-normal text-emerald-100/70 leading-relaxed">
                O MIX10 PRO age de dentro para fora, oferecendo suporte contínuo para manter sua musculatura, ossos e articulações nutridos e prontos para qualquer atividade.
              </p>
            </div>

            <div className="lg:col-span-7 relative z-10">
              <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-12 lg:pl-10">
                {[
                  {
                    icon: Footprints,
                    title: "MOVIMENTOS MAIS LEVES",
                    desc: "Sustentação ideal para que caminhar e se movimentar façam parte da rotina sem peso ou desconfortos.",
                  },
                  {
                    icon: BicepsFlexed,
                    title: "CORPO MENOS TRAVADO",
                    desc: "Cuidado contínuo para evitar aquela rigidez incômoda ao levantar da cama.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "ESTABILIDADE DIÁRIA",
                    desc: "Firmeza e segurança reforçadas para cada passo que você der.",
                  },
                  {
                    icon: Activity,
                    title: "BEM-ESTAR INTEGRAL",
                    desc: "Preservação da saúde muscular e óssea para que você mantenha sua autonomia.",
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

      {/* INGREDIENTES SECTION */}
      <section
        id="section-ingredientes"
        className="relative bg-[#F8F9FA] py-20 lg:py-24 px-6 sm:px-8 lg:px-[120px] overflow-visible"
        style={{ zIndex: 30 }}
      >
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/[0.03] blur-[140px] rounded-full"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/[0.04] blur-[120px] rounded-full"></div>
        </div>

        <div id="ingredientes" className="relative z-10 mx-auto max-w-5xl">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start relative">
            {/* Left Col */}
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

              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/50 px-4 py-2 backdrop-blur-sm relative z-10">
                <Award className="h-3 w-3 text-emerald-700" strokeWidth={1.5} />
                <span className="text-[9px] font-medium uppercase tracking-widest text-gray-500">
                  Fórmula Premium
                </span>
              </div>

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

            {/* Right Col */}
            <div className="mt-8 lg:mt-0 lg:col-span-7 flex flex-col gap-6 relative z-10">
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

              <div className="mt-6 border-t border-gray-200/50 pt-8">
                <CompositionAccordion />

                <p className="mt-8 text-[13px] font-normal text-gray-400 italic max-w-[400px]">
                  E outros ativos estrategicamente combinados para complementar a atuação da fórmula no suporte diário ao corpo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARATIVO SECTION */}
      <section className="bg-white py-20 lg:py-24 px-6 sm:px-8 lg:px-[120px]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest uppercase leading-tight text-emerald-700 mb-6 block">
              O DIFERENCIAL MIX10 PRO
            </span>
            <h2 className="text-xl font-light tracking-tight text-gray-900 sm:text-2xl lg:text-3xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.15]">
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
                  { text: "Fórmula desenvolvida para agir em conjunto — não apenas em um único ponto do corpo." },
                  { text: "Atua sobre articulações, músculos e mobilidade ao mesmo tempo." },
                  { text: "Ingredientes selecionados para melhor absorção e uso contínuo." },
                  { text: "Desenvolvido para quem já sente os impactos da rotina no corpo." },
                  { text: "Mais liberdade nos movimentos sem depender de soluções superficiais." },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/80 p-5 rounded-2xl shadow-sm border border-emerald-50">
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
                  { text: "Fórmulas isoladas com foco limitado." },
                  { text: "Atuação parcial sem abordagem completa do desgaste diário." },
                  { text: "Ingredientes comuns com menor eficiência de absorção." },
                  { text: "Resultados inconsistentes ao longo do uso." },
                  { text: "Soluções temporárias sem continuidade real." },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/60 p-5 rounded-2xl shadow-sm border border-white">
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

      {/* SEGURANÇA E TRANSPARÊNCIA */}
      <section className="bg-gray-50 py-16 px-6 sm:px-8 border-t border-gray-100">
        <div className="mx-auto max-w-4xl bg-white border border-gray-200/60 rounded-3xl p-8 md:p-12 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl md:text-2xl font-light text-gray-900 tracking-tight leading-[1.2]">
            Segurança, transparência e suporte ao cliente
          </h2>
          <p className="mt-4 text-[13px] font-normal text-gray-600 leading-relaxed max-w-xl mx-auto">
            Nós valorizamos a sua tranquilidade. Por isso, oferecemos uma compra 100% segura, com criptografia de ponta no checkout e atendimento de suporte próximo para acompanhar sua rotina de cuidado contínuo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-emerald-800">
            <span>✓ Compra segura e atendimento próximo</span>
            <span className="hidden sm:inline">•</span>
            <span>✓ Suporte via WhatsApp</span>
            <span className="hidden sm:inline">•</span>
            <span>✓ Rastreamento de Pedido</span>
          </div>
        </div>
      </section>

      {/* OFERTA FINAL */}
      <section id="section-oferta-final" className="bg-[#F8F6F4] border-y border-gray-100 py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-8 text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-emerald-700 block mb-3">
            Garanta Seu MIX10 PRO
          </span>
          <h2 className="text-2xl font-light tracking-tight text-gray-900 sm:text-3xl lg:text-4xl leading-[1.2]">
            O melhor momento para começar é agora
          </h2>
          <p className="mt-3 text-xs text-gray-500 font-normal">
            Garanta seu MIX10 PRO com segurança e tranquilidade.
          </p>

          <PricingGrid onBuy={openCheckout} origin="OfferBottom" />
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
        lpVersion="v2"
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

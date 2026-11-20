import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, ArrowLeft, ArrowRight } from "lucide-react";

const TEXT_TESTIMONIALS = [
  {
    text: "“Eu estava acordando todo dia com o corpo muito travado, principalmente as pernas e a lombar. Depois de uma semana usando comecei a perceber diferença pra levantar da cama e pra andar. Parece que o corpo ficou mais leve.”",
    name: "Carla Mendes",
    rating: 5,
    avatar: "/test-1.png",
  },
  {
    text: "“Minha mãe vivia reclamando de dor no joelho e quase não queria sair mais. Eu dei o MIX10 PRO pra ela testar e hoje ela já consegue caminhar melhor e voltou até a fazer as coisas dela dentro de casa.”",
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
    text: "“Eu estava num ponto que pra abaixar e amarrar o tênis era uma dificuldade enorme. Tinha dia que eu evitava até subir escada porque o joelho doía demais. Depois de alguns dias usando comecei a perceber meu corpo respondendo diferente.”",
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
];

const CAROUSEL_VIDEOS = [
  { id: 0, src: "/dp-isabel.mp4" },
  { id: 1, src: "/dp-mariasocorro.mp4" },
  { id: 2, src: "/dp-sra.mp4" },
  { id: 3, src: "/dp-xangrila.mp4" },
];

// Duplicate the items array to create a seamless infinite loop track
const EXTENDED_VIDEOS = [
  ...CAROUSEL_VIDEOS, // Index 0, 1, 2
  ...CAROUSEL_VIDEOS, // Index 3, 4, 5 (Middle copy)
  ...CAROUSEL_VIDEOS, // Index 6, 7, 8
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

  // Reset states and replay from 0:00 on central active video switch
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset sound states when active status changes
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

  // Handle scroll visibility changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isVisible) {
      // Inactive, invisible videos are strictly paused, reset to start to show their cover/poster
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

  // Mask Style to fade the card itself transparently on its outer edge
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

export default function Testimonials() {
  const [activeTextPage, setActiveTextPage] = useState(0);
  const [activeTrackIndex, setActiveTrackIndex] = useState(5); // Start at index 5 (video 1)
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const totalTextPages = Math.ceil(TEXT_TESTIMONIALS.length / 2);

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

  const nextTextPage = () => {
    setActiveTextPage((prev) => (prev + 1) % totalTextPages);
  };

  const prevTextPage = () => {
    setActiveTextPage((prev) => (prev - 1 + totalTextPages) % totalTextPages);
  };

  const visibleTestimonials = [
    TEXT_TESTIMONIALS[activeTextPage * 2],
    TEXT_TESTIMONIALS[activeTextPage * 2 + 1],
  ];

  const handleCardClick = (idx: number) => {
    if (!isTransitioning) return;
    if (idx !== activeTrackIndex) {
      setActiveTrackIndex(idx);
    }
  };

  // Dimensions configuration
  const cardWidth = isMobile ? 230 : 220; // 220px on desktop to prevent grid column clipping
  const gap = isMobile ? 16 : 20; // 20px gap on desktop

  const transitionStyle = isTransitioning ? "transform 500ms ease-out" : "none";

  return (
    <section
      data-section="testimonials"
      id="depoimentos"
      className="bg-[#021c12] text-white py-20 lg:py-24 px-3 sm:px-8 lg:px-[120px] relative overflow-hidden border-b border-gray-100/10"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_#0b7655_0%,_#021c12_70%)] opacity-20 pointer-events-none z-0"></div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-3 sm:px-8">
        <div className="text-center mb-14">
          <h2 className="mt-4 text-2xl font-light tracking-tight text-white sm:text-3xl lg:text-4xl leading-[1.2] max-w-2xl mx-auto">
            Veja o que nossos clientes contam sobre sua experiência com o <span className="italic text-emerald-400 font-normal">MIX10 PRO.</span>
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xs sm:text-sm font-normal text-emerald-100/70 leading-relaxed">
            Relatos espontâneos de pessoas que escolheram incluir o MIX10 PRO na sua rotina.
          </p>
        </div>

        {/* 1. Video Testimonials Carousel Block */}
        <div className="flex flex-col items-center mb-6">
          
          {/* Centered Video Carousel Column */}
          <div className="w-full relative overflow-visible select-none py-4 px-1 flex flex-col items-center">
            
            {/* Slider track viewport - set to max-w-[740px] to make all 3 videos completely visible on desktop */}
            <div className="relative w-full max-w-[740px] mx-auto overflow-hidden py-12 rounded-2xl">
              
              {/* Left and Right Nav Buttons */}
              <button
                onClick={handlePrevVideo}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-emerald-950/85 hover:bg-emerald-800 text-white flex items-center justify-center shadow-lg border border-emerald-500/25 transition-all active:scale-95 cursor-pointer z-30"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleNextVideo}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-emerald-950/85 hover:bg-emerald-800 text-white flex items-center justify-center shadow-lg border border-emerald-500/25 transition-all active:scale-95 cursor-pointer z-30"
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

            {/* Dots indicator (mapped to video IDs 0, 1, 2) */}
            <div className="flex justify-center gap-1.5 mt-5">
              {CAROUSEL_VIDEOS.map((video) => {
                const currentVideoId = EXTENDED_VIDEOS[activeTrackIndex].id;
                const isDotActive = video.id === currentVideoId;
                return (
                  <button
                    key={video.id}
                    onClick={() => {
                      // Center map to middle copy equivalents
                      setActiveTrackIndex(video.id + 4);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      isDotActive ? "bg-emerald-400 w-4" : "bg-emerald-800/60"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Centered Intro Text - Positioned below the carousel */}
          <div className="flex flex-col text-center justify-center items-center max-w-xl mx-auto mt-4 mb-6">
            <h3 className="text-xl sm:text-2xl font-light text-white leading-tight mb-4">
              Resultados reais contados <span className="font-semibold text-emerald-400">por quem realmente usa.</span>
            </h3>
            <p className="text-xs sm:text-sm font-normal text-emerald-100/75 leading-relaxed mb-6">
              Veja estes depoimentos de quem indica o MIX10 PRO.
            </p>
            
            <div className="flex justify-center items-center gap-3">
              <div className="flex -space-x-3">
                <img src="/test-7.png" alt="" className="w-9 h-9 rounded-full border border-[#021c12] object-cover relative z-30" />
                <img src="/test-8.png" alt="" className="w-9 h-9 rounded-full border border-[#021c12] object-cover relative z-20" />
                <img src="/test-9.png" alt="" className="w-9 h-9 rounded-full border border-[#021c12] object-cover relative z-10" />
              </div>
              <div className="text-left">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[9px] text-emerald-100/60 uppercase tracking-widest font-bold">
                  Mais de 4.000 vidas transformadas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-emerald-500/10 my-12" />

        {/* 3. Text Reviews / Stars */}
        <div className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 min-h-[180px]">
            {visibleTestimonials.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <span className="text-[4.5rem] font-serif text-emerald-400/30 leading-none -mt-5 select-none">
                  “
                </span>
                <div className="flex-1 flex flex-col justify-between h-full">
                  <p className="text-emerald-100/85 text-xs sm:text-sm leading-relaxed font-light mb-4">
                    {item.text}
                  </p>
                  
                  <div className="w-full h-[1px] bg-emerald-500/10 mb-4.5" />
                  
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/25"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white tracking-wide">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[10px] text-emerald-300/60 font-medium">
                          5/5 • Compra verificada
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Buttons */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={prevTextPage}
              className="w-10 h-10 rounded-full border border-emerald-500/20 flex items-center justify-center text-emerald-100 hover:bg-emerald-800/30 hover:border-emerald-400 transition-all active:scale-90 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-semibold text-emerald-300/50 uppercase tracking-widest">
              Página {activeTextPage + 1} de {totalTextPages}
            </span>
            <button
              onClick={nextTextPage}
              className="w-10 h-10 rounded-full border border-emerald-500/20 flex items-center justify-center text-emerald-100 hover:bg-emerald-800/30 hover:border-emerald-400 transition-all active:scale-90 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

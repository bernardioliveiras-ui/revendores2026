import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import KitSelector from "./KitSelector";

interface HeroProps {
  onBuy: (id: number, origin: "OfferTop" | "OfferBottom", quantity?: number) => void;
}

export default function Hero({ onBuy }: HeroProps) {
  const [selectedKitId, setSelectedKitId] = useState(1); // Default: Kit 1 Caixa (id 1)
  const [mainImageSrc, setMainImageSrc] = useState("/kit-1.webp"); // Default main view is 1 Caixa image
  
  const [userInteracted, setUserInteracted] = useState(false);
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Swipe gesture hooks
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Dynamic gallery images for single box
  const galleryImages = useMemo(() => {
    return [
      "/kit-1.webp",
      "/caixa-frontal.png",
      "/thumb-4.webp",
      "/t4.webp",
      "/t5.webp"
    ];
  }, []);

  // Sync: Selecting a kit updates the main image to the corresponding kit photo
  const handleSelectKit = (kitId: number) => {
    setSelectedKitId(kitId);
    setMainImageSrc("/kit-1.webp");
  };

  // Find which thumbnail matches the active main image
  const activeThumbnailIndex = galleryImages.findIndex(
    (img) => img === mainImageSrc
  );

  // Navigation handlers (cycles through the dynamic gallery images)
  const prevImage = () => {
    setUserInteracted(true);
    let nextIndex;
    const galleryIndex = galleryImages.indexOf(mainImageSrc);
    if (galleryIndex === -1) {
      nextIndex = 0;
    } else {
      nextIndex = galleryIndex === 0 ? galleryImages.length - 1 : galleryIndex - 1;
    }
    setMainImageSrc(galleryImages[nextIndex]);
  };

  const nextImage = () => {
    setUserInteracted(true);
    let nextIndex;
    const galleryIndex = galleryImages.indexOf(mainImageSrc);
    if (galleryIndex === -1) {
      nextIndex = 0;
    } else {
      nextIndex = galleryIndex === galleryImages.length - 1 ? 0 : galleryIndex + 1;
    }
    setMainImageSrc(galleryImages[nextIndex]);
  };

  // Thumbnail click handler (updates main image)
  const handleThumbnailClick = (idx: number) => {
    setUserInteracted(true);
    setMainImageSrc(galleryImages[idx]);
  };

  // Autoplay functionality (slowly cycles through gallery images, pauses on user interaction)
  useEffect(() => {
    if (userInteracted) {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
        autoplayIntervalRef.current = null;
      }
      return;
    }

    autoplayIntervalRef.current = setInterval(() => {
      const galleryIndex = galleryImages.indexOf(mainImageSrc);
      const nextIndex = galleryIndex === -1 ? 0 : (galleryIndex + 1) % galleryImages.length;
      setMainImageSrc(galleryImages[nextIndex]);
    }, 4500); // Slow transition interval (4.5s)

    return () => {
      if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
    };
  }, [mainImageSrc, galleryImages, userInteracted]);

  // Swipe gesture event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      setUserInteracted(true);
      if (isLeftSwipe) nextImage();
      if (isRightSwipe) prevImage();
    }
  };

  // Calculate position index label (matches gallery image index or default to 1)
  const currentDisplayNumber = activeThumbnailIndex === -1 ? 1 : activeThumbnailIndex + 1;

  return (
    <section
      data-section="hero"
      id="hero"
      className="relative bg-[#F8F6F4] pt-4 pb-8 md:pt-12 md:pb-16 border-b border-gray-100"
    >
      <div className="mx-auto max-w-[1440px] px-3 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_1fr] gap-6 md:gap-10 lg:gap-10 items-start">
          
          <div className="flex flex-col items-center lg:sticky lg:top-[78px] lg:self-start w-full">
            {/* Main Image Container */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full aspect-square max-w-[245px] sm:max-w-[310px] md:max-w-[430px] lg:max-w-[580px] rounded-3xl overflow-hidden bg-white/40 border border-gray-200/50 shadow-sm flex items-center justify-center group"
            >
              {/* Product Image scaled up 10-15% */}
              <img
                src={mainImageSrc}
                alt="MIX10 PRO Produto"
                className="w-[115%] h-[115%] object-contain select-none transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Side Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Position indicator */}
              <div className="absolute bottom-3 right-3 bg-emerald-950/85 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                {currentDisplayNumber} / {galleryImages.length}
              </div>
            </div>

            {/* Thumbnail Selectors (Desktop only, Static thumbnails) */}
            <div className="hidden md:flex gap-3 mt-4 justify-center">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 bg-white flex items-center justify-center p-0.5 transition-all cursor-pointer ${
                    idx === activeThumbnailIndex
                      ? "border-emerald-700 shadow-sm scale-105"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col text-center md:text-left items-stretch justify-start gap-1 w-full">
            
            {/* 1. Star Rating & Clean Social Proof */}
            <div className="flex items-center gap-1.5 justify-center md:justify-start mt-1 md:mt-0">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide">
                4.9/5 • Mais de 4.800 avaliações
              </span>
            </div>

            {/* 2. Exclusive Conversion Headline */}
            <h1 className="text-lg sm:text-2xl md:text-[30px] font-black tracking-tight text-gray-900 leading-[1.15] mt-1 md:mt-1.5">
              Movimentos livres, corpo destravado:{" "}
              <span className="text-emerald-700 block md:inline">
                viva com máximo conforto e qualidade.
              </span>
            </h1>

            {/* 3. Quick Trust Checklist */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 md:gap-x-5.5 gap-y-1.5 mt-2 md:mt-3 mb-3 md:mb-4.5 text-[10px] md:text-[11.5px] font-black text-emerald-800 uppercase tracking-wider">
              <span className="flex items-center gap-0.5">✔ Compra Segura</span>
              <span className="flex items-center gap-0.5">✔ Fórmula Premium</span>
              <span className="flex items-center gap-0.5">✔ Envio Rápido</span>
            </div>

            {/* 4. Pricing Configurator */}
            <KitSelector
              onBuy={onBuy}
              origin="OfferTop"
              selectedKitId={selectedKitId}
              onSelectKit={handleSelectKit}
            />

            {/* Trust footer under Selector - Centered on all screens */}
            <div className="mt-3.5 flex flex-col items-center justify-center gap-1.5 w-full text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400 uppercase tracking-widest">
                <Lock className="w-3 h-3" />
                <span>Transação 100% criptografada</span>
              </div>
              <div className="flex items-center justify-center gap-2 opacity-65">
                <img
                  src="/selocartoes-min.jpg"
                  alt="Formas de Pagamento"
                  className="h-[23px] object-contain"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

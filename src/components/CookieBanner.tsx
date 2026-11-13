import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const checkConsent = () => {
      const consentText = localStorage.getItem('mix10pro_cookie_consent');
      if (!consentText) return false;
      
      try {
        const consent = JSON.parse(consentText);
        const now = new Date().getTime();
        const twelveMonths = 12 * 30 * 24 * 60 * 60 * 1000;
        
        if (now - consent.timestamp > twelveMonths) {
          localStorage.removeItem('mix10pro_cookie_consent');
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    };

    if (!checkConsent()) {
      // Small delay just to feel elegant on load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('mix10pro_cookie_consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().getTime()
    }));
    setIsVisible(false);
    setShowConfig(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('mix10pro_cookie_consent', JSON.stringify({
      ...preferences,
      timestamp: new Date().getTime()
    }));
    setIsVisible(false);
    setShowConfig(false);
  };

  if (!isVisible && !showConfig) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && !showConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-6 z-[100] w-[calc(100%-48px)] sm:w-max max-w-[400px] rounded-[24px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Cookie className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] leading-relaxed text-gray-600 font-light mt-1">
                  Utilizamos cookies para melhorar sua experiência e personalizar conteúdo e anúncios.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleAcceptAll}
                  className="rounded-full bg-emerald-950 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-emerald-800"
                >
                  ACEITAR
                </button>
                <button
                  onClick={() => setShowConfig(true)}
                  className="rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500 transition-all hover:text-gray-800"
                >
                  CONFIGURAÇÕES
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm"
              onClick={() => setShowConfig(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-white p-8 shadow-2xl shadow-gray-200/50"
            >
              <button 
                onClick={() => setShowConfig(false)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>

              <h2 className="text-xl font-light tracking-tight text-emerald-950 mb-6">
                Preferências de Cookies
              </h2>

              <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-gray-800">Cookies necessários</span>
                    <span className="text-[12px] text-gray-500">Sempre ativos para o funcionamento do site.</span>
                  </div>
                  <div className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-emerald-500">
                    <span className="translate-x-2 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                  </div>
                </div>

                <div className="h-[1px] w-full bg-gray-50" />

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-gray-800 transition-colors group-hover:text-emerald-700">Cookies analíticos</span>
                    <span className="text-[12px] text-gray-500">Ajudam a entender como os visitantes interagem com o site.</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${preferences.analytics ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.analytics ? 'translate-x-4' : 'translate-x-1'}`} />
                  </div>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                  />
                </label>

                <div className="h-[1px] w-full bg-gray-50" />

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-gray-800 transition-colors group-hover:text-emerald-700">Cookies de marketing</span>
                    <span className="text-[12px] text-gray-500">Usados para fornecer anúncios mais relevantes para você.</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${preferences.marketing ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.marketing ? 'translate-x-4' : 'translate-x-1'}`} />
                  </div>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  onClick={handleSavePreferences}
                  className="w-full rounded-full border border-gray-200 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-950 transition-all hover:bg-gray-50"
                >
                  Salvar Preferências
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="w-full rounded-full bg-emerald-950 px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-emerald-800"
                >
                  Aceitar Tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

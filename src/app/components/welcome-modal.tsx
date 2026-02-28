import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, X } from 'lucide-react';

interface WelcomeModalProps {
  onComplete?: () => void;
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome message
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome_v1');
    if (!hasSeenWelcome) {
      // Small delay to show after initial load
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcome_v1', 'true');
    if (onComplete) {
        // Small delay to allow modal to close animation
        setTimeout(onComplete, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-500 scale-100 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-yellow-100 rounded-full blur-2xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-pink-100 rounded-full blur-2xl opacity-50" />
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-4 rounded-full shadow-inner">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-800 font-handwriting">
              {t('welcome.title')}
            </h2>
            <div className="w-16 h-1 bg-rose-200 rounded-full mx-auto" />
          </div>

          <p className="text-xl text-gray-600 font-handwriting leading-relaxed px-4">
            {t('welcome.quote')}
          </p>
          
          <p className="text-gray-500 text-sm">
            {t('welcome.subtitle')}
          </p>

          <button
            onClick={handleClose}
            className="group relative px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 font-medium">{t('welcome.start')}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
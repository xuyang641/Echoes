import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface WelcomeModalProps {
  onComplete?: () => void;
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if THIS specific user has seen the welcome message
    const storageKey = `hasSeenWelcome_v1_${user.id}`;
    // Force show for debugging if needed, or remove this line for production
    // localStorage.removeItem(storageKey); 
    
    const hasSeenWelcome = localStorage.getItem(storageKey);
    
    if (!hasSeenWelcome) {
      // Small delay to show after initial load
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Exposed method to manually trigger welcome for testing
  useEffect(() => {
    const handleForceWelcome = () => {
        setIsOpen(true);
        setIsAgreed(false); // Reset agreement state
        // Clear storage to make it permanent for this session
        const storageKey = `hasSeenWelcome_v1_${user?.id}`;
        localStorage.removeItem(storageKey);
    };
    window.addEventListener('force-welcome', handleForceWelcome);
    return () => window.removeEventListener('force-welcome', handleForceWelcome);
  }, [user]);

  const handleCreateWelcomeDiary = () => {
    if (!user) return;

    const welcomeEntry = {
      id: 'welcome-entry-' + Date.now(),
      date: new Date().toISOString(),
      photo: '/images/backgrounds/forest-morning.jpg', // Use local asset for reliability
      caption: '欢迎来到 Echoes。这是您的第一篇日记。\n\n在这里，您可以：\n✨ 记录生活的点滴\n🗺️ 在地图上留下足迹\n🎵 聆听白噪音放松身心\n\n所有的美好，都值得被铭记。',
      mood: 'happy',
      location: {
        lat: 39.9042,
        lng: 116.4074,
        name: 'Echoes - 新的开始'
      },
      tags: ['Echoes', '新的开始', '使用指南'],
      aiTags: ['welcome', 'start', 'guide'],
      groupIds: ['private']
    };

    window.dispatchEvent(new CustomEvent('create-welcome-entry', { detail: welcomeEntry }));
  };

  const handleClose = () => {
    if (!isAgreed || !user) return;
    
    setIsOpen(false);
    const storageKey = `hasSeenWelcome_v1_${user.id}`;
    localStorage.setItem(storageKey, 'true');
    
    // Create the welcome diary entry
    handleCreateWelcomeDiary();

    if (onComplete) {
        // Small delay to allow modal to close animation
        setTimeout(onComplete, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Render as a separate div if needed, but keeping simple structure helps */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500"
        onClick={() => {}} // Prevent clicks from bubbling
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-500 scale-100 overflow-hidden z-10">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-yellow-100 rounded-full blur-2xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-pink-100 rounded-full blur-2xl opacity-50" />
        
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

          <div className="flex items-start gap-3 px-4 py-2 bg-gray-50 rounded-lg w-full">
            <button 
              onClick={() => setIsAgreed(!isAgreed)}
              className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border transition-colors flex items-center justify-center ${
                isAgreed ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-300 bg-white'
              }`}
            >
              {isAgreed && <Check className="w-3 h-3" />}
            </button>
            <div className="text-xs text-left text-gray-600 leading-relaxed">
              {t('welcome.agreement')}
              <Link to="/privacy" target="_blank" className="text-rose-500 underline underline-offset-2 hover:text-rose-600 font-medium">
                {t('welcome.privacy')}
              </Link>
              {t('welcome.and')}
              <Link to="/terms" target="_blank" className="text-rose-500 underline underline-offset-2 hover:text-rose-600 font-medium">
                {t('welcome.terms')}
              </Link>
              {t('welcome.agreement_suffix', '')}
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={!isAgreed}
            className={`group relative px-8 py-3 rounded-xl shadow-lg transition-all duration-300 overflow-hidden ${
              isAgreed 
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-xl hover:scale-105 cursor-pointer' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="relative z-10 font-medium">{t('welcome.start')}</span>
            {isAgreed && (
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Camera, Map, Sparkles, Shield, ChevronRight, Check } from 'lucide-react';

interface OnboardingTutorialProps {
  onComplete: () => void;
  isOpen: boolean;
}

const slides = [
  {
    id: 1,
    title: "记录美好",
    description: "随时随地记录生活点滴，捕捉每一个珍贵瞬间。",
    icon: Camera,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-full h-full text-current opacity-80" fill="none">
        <rect x="40" y="40" width="120" height="120" rx="20" className="fill-blue-50 dark:fill-blue-900/20" />
        <circle cx="100" cy="100" r="30" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="8" />
        <path d="M140 60L160 40" className="stroke-blue-300 dark:stroke-blue-600" strokeWidth="4" strokeLinecap="round" />
        <circle cx="170" cy="30" r="5" className="fill-yellow-400 animate-pulse" />
      </svg>
    )
  },
  {
    id: 2,
    title: "回顾足迹",
    description: "在地图上重温你的旅程，点亮世界的每一个角落。",
    icon: Map,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-full h-full text-current opacity-80" fill="none">
        <path d="M40 100 Q100 40 160 100 T280 100" className="stroke-green-200 dark:stroke-green-800" strokeWidth="4" fill="none" />
        <path d="M100 160 L100 80" className="stroke-green-500 dark:stroke-green-400" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="80" r="8" className="fill-red-500 animate-bounce" />
        <ellipse cx="100" cy="160" rx="20" ry="6" className="fill-green-200 dark:fill-green-800 opacity-50" />
      </svg>
    )
  },
  {
    id: 3,
    title: "AI 伴侣",
    description: "与 AI 对话，探索回忆深处的情感与故事。",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-full h-full text-current opacity-80" fill="none">
        <circle cx="100" cy="100" r="60" className="stroke-purple-200 dark:stroke-purple-800" strokeWidth="2" strokeDasharray="8 8" />
        <circle cx="100" cy="100" r="40" className="fill-purple-50 dark:fill-purple-900/20" />
        <path d="M85 90 L100 110 L115 90" className="stroke-purple-500 dark:stroke-purple-400" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="100" cy="70" r="6" className="fill-purple-400" />
        <path d="M140 140 L160 120" className="stroke-yellow-400" strokeWidth="4" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 4,
    title: "安全私密",
    description: "数据本地存储，完全属于你，安全无忧。",
    icon: Shield,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    illustration: (
      <svg viewBox="0 0 200 200" className="w-full h-full text-current opacity-80" fill="none">
        <rect x="60" y="80" width="80" height="80" rx="10" className="fill-orange-50 dark:fill-orange-900/20 stroke-orange-500 dark:stroke-orange-400" strokeWidth="4" />
        <path d="M70 80 V60 Q70 30 100 30 Q130 30 130 60 V80" className="stroke-orange-500 dark:stroke-orange-400" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="120" r="8" className="fill-orange-400" />
        <path d="M100 120 V140" className="stroke-orange-400" strokeWidth="4" strokeLinecap="round" />
      </svg>
    )
  }
];

export function OnboardingTutorial({ onComplete, isOpen }: OnboardingTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Swipe logic
  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -10000) {
      handleNext();
    } else if (swipe > 10000) {
      handlePrev();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  };

  if (!isOpen) return null;

  const currentContent = slides[currentSlide];
  const Icon = currentContent.icon;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col items-center justify-between p-6 overflow-hidden">
      {/* Skip Button */}
      <div className="w-full flex justify-end pt-4 md:pt-8">
        <button 
          onClick={handleSkip}
          className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors px-4 py-2"
        >
          跳过
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center relative min-h-[400px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute w-full flex flex-col items-center text-center cursor-grab active:cursor-grabbing"
          >
            {/* Illustration */}
            <div className={`w-64 h-64 mb-8 rounded-full ${currentContent.color} flex items-center justify-center p-8 relative overflow-hidden shadow-lg`}>
              <div className="w-full h-full relative z-10">
                {currentContent.illustration}
              </div>
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
            </div>

            {/* Text */}
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-serif"
            >
              {currentContent.title}
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs"
            >
              {currentContent.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="w-full max-w-md flex flex-col gap-8 pb-8 md:pb-12">
        {/* Indicators */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1);
                setCurrentSlide(index);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-blue-600 dark:bg-blue-400' 
                  : 'w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all duration-300 ${
            currentSlide === slides.length - 1
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
          }`}
        >
          {currentSlide === slides.length - 1 ? (
            <>
              开始旅程 <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              下一步 <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
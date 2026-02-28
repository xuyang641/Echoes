import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

interface InteractionManagerProps {
  onAIChatOpen: () => void;
  children: (props: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    scrollDirection: 'up' | 'down';
  }) => React.ReactElement;
}

export function InteractionManager({ onAIChatOpen, children }: InteractionManagerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Define the order of tabs for swipe navigation
  const tabs = ['/', '/calendar', '/map', '/insights', '/couple', '/milestones'];

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Disable swipe navigation on Map view to prevent conflict with map panning
    if (location.pathname === '/map') return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.indexOf(location.pathname);
      if (currentIndex !== -1) {
        if (isLeftSwipe && currentIndex < tabs.length - 1) {
          navigate(tabs[currentIndex + 1]);
        }
        if (isRightSwipe && currentIndex > 0) {
          navigate(tabs[currentIndex - 1]);
        }
      }
    }
  };

  return (
    <>
      {children({
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        scrollDirection
      })}
      
      {/* Floating AI Button is managed here as it depends on scroll direction */}
      <button
        onClick={onAIChatOpen}
        className={`fixed right-6 z-40 p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group ${
          scrollDirection === 'down' ? 'translate-x-24 opacity-50' : 'translate-x-0 opacity-100'
        } bottom-24 md:bottom-6`}
      >
        <Bot className="w-6 h-6" />
      </button>
    </>
  );
}
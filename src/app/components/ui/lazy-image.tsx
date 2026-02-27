import { useState, useEffect, useRef } from 'react';
import { cn } from '../ui/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  aspectRatio = 'auto',
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before it comes into view
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  // Fallback image for errors
  const finalSrc = error || !src
    ? 'https://via.placeholder.com/400x300?text=Image+Error' 
    : (isInView ? src : '');

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  }[aspectRatio];

  return (
    <div 
      ref={imgRef} 
      className={cn(
        "relative overflow-hidden bg-gray-100 dark:bg-gray-800 touch-pan-y", // Added touch-pan-y to prevent scroll blocking
        aspectRatioClass,
        className
      )}
    >
      {/* BlurHash Placeholder (Simple CSS Blur) */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
           <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 opacity-50 blur-xl scale-110" />
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={finalSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-all duration-700 ease-in-out",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}
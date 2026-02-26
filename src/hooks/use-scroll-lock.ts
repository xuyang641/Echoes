import { useEffect } from 'react';

export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      // Optional: Prevent iOS bounce/scroll chaining if needed, 
      // but overflow: hidden is usually sufficient for simple modals.
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
}

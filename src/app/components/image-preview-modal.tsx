import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function ImagePreviewModal({ isOpen, imageUrl, onClose }: ImagePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center touch-none"
        onClick={onClose}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-4" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={onClose}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="w-full h-full flex items-center justify-center">
            <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={4}
                centerOnInit
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4" onClick={(e) => e.stopPropagation()}>
                             <button onClick={() => zoomOut()} className="p-3 bg-black/50 rounded-full text-white backdrop-blur-sm hover:bg-white/20">
                                <ZoomOut className="w-5 h-5" />
                             </button>
                             <button onClick={() => resetTransform()} className="px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium backdrop-blur-sm hover:bg-white/20">
                                Reset
                             </button>
                             <button onClick={() => zoomIn()} className="p-3 bg-black/50 rounded-full text-white backdrop-blur-sm hover:bg-white/20">
                                <ZoomIn className="w-5 h-5" />
                             </button>
                        </div>
                        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                            <img 
                                src={imageUrl} 
                                alt="Preview" 
                                className="max-w-full max-h-full object-contain"
                            />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

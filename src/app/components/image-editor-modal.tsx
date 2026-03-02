import { useState, useRef, useEffect } from 'react';
import { X, Check, Loader2, Wand2 } from 'lucide-react';
import { FILTERS, applyFilterToImage } from '../../utils/image-filters';

interface ImageEditorModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newImageSrc: string) => void;
}

export function ImageEditorModal({ imageSrc, isOpen, onClose, onSave }: ImageEditorModalProps) {
  const [selectedFilter, setSelectedFilter] = useState('original');
  const [previewSrc, setPreviewSrc] = useState(imageSrc);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Apply filter when selection changes
  useEffect(() => {
    if (!isOpen) return;
    
    // For preview, we might want to use a smaller version or just apply directly
    // Here we apply to the main image for simplicity
    const apply = async () => {
      if (selectedFilter === 'original') {
        setPreviewSrc(imageSrc);
        return;
      }

      setProcessing(true);
      try {
        // Use a small delay to let UI update
        setTimeout(async () => {
          const newSrc = await applyFilterToImage(imageSrc, selectedFilter);
          setPreviewSrc(newSrc);
          setProcessing(false);
        }, 50);
      } catch (err) {
        console.error('Filter error:', err);
        setProcessing(false);
      }
    };

    apply();
  }, [selectedFilter, imageSrc, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(previewSrc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-in fade-in duration-200">
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <h3 className="font-medium">编辑图片</h3>
          <button 
            onClick={handleSave}
            disabled={processing}
            className="p-2 text-blue-400 hover:text-blue-300 font-medium"
          >
            <Check className="w-6 h-6" />
          </button>
        </div>

        {/* Main Image Preview */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <img 
            src={previewSrc} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
          />
        </div>

        {/* Filter Selector */}
        <div className="bg-black/50 backdrop-blur-md p-4 pb-8 space-y-4">
          <div className="flex items-center gap-2 text-white/80 text-sm px-2">
            <Wand2 className="w-4 h-4" />
            <span>选择滤镜</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex flex-col items-center gap-2 min-w-[70px] snap-center transition-all ${
                  selectedFilter === filter.id ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-80'
                }`}
              >
                <div className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  selectedFilter === filter.id ? 'border-blue-500' : 'border-transparent'
                }`}>
                  {/* Thumbnail Preview - ideally pre-generated, here we just show original as placeholder or simple css filter */}
                  <img 
                    src={imageSrc} 
                    alt={filter.name} 
                    className="w-full h-full object-cover"
                    style={{ 
                      filter: filter.id === 'grayscale' ? 'grayscale(100%)' :
                              filter.id === 'sepia' ? 'sepia(100%)' :
                              filter.id === 'warm' ? 'saturate(1.2) hue-rotate(-10deg)' :
                              filter.id === 'cool' ? 'hue-rotate(10deg)' :
                              'none'
                    }}
                  />
                </div>
                <span className="text-xs text-white font-medium">{filter.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
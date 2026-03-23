import { useState, useRef } from 'react';
import { X, Download, Share2, Sparkles, MapPin } from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { DiaryEntry } from './diary-entry-form';

interface ShareModalProps {
  entry: DiaryEntry;
  onClose: () => void;
}

export function ShareModal({ entry, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      // Small delay to ensure any fonts/images are fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 3, // High quality for long images
        backgroundColor: '#fcfbf9' // Match the card background
      });
      
      const link = document.createElement('a');
      link.download = `echoes-diary-${format(new Date(entry.date), 'yyyyMMdd')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('生成长图失败，请重试。');
    } finally {
      setIsGenerating(false);
    }
  };

  const entryDate = new Date(entry.date);
  const day = format(entryDate, 'dd');
  const monthYear = format(entryDate, 'yyyy.MM');
  const weekday = format(entryDate, 'EEEE', { locale: zhCN });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900 rounded-t-3xl z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            分享日记长图
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800/50 custom-scrollbar flex justify-center items-start min-h-0 relative z-0">
          {/* The Target Card to Capture */}
          <div 
            ref={cardRef}
            className="bg-[#fcfbf9] w-full max-w-[375px] shadow-sm overflow-hidden shrink-0"
            style={{ fontFamily: '"LXGW WenKai", sans-serif' }}
          >
            {/* Top Date Header */}
            <div className="px-6 pt-8 pb-4 flex justify-between items-end">
              <div className="flex items-baseline gap-2 text-[#2c2c2c]">
                <span className="text-4xl font-bold leading-none" style={{ fontFamily: 'sans-serif' }}>{day}</span>
                <div className="flex flex-col">
                  <span className="text-xs tracking-widest text-gray-500 font-sans">{weekday}</span>
                  <span className="text-xs tracking-widest text-gray-500 font-sans">{monthYear}</span>
                </div>
              </div>
              <div className="text-sm font-medium px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm text-gray-600 flex items-center gap-1">
                {entry.mood}
              </div>
            </div>

            {/* Photo / AI Illustration */}
            <div className="px-4">
              <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                <img 
                  src={entry.photo} 
                  alt="Diary visual" 
                  className="w-full h-auto object-cover max-h-[500px]"
                  crossOrigin="anonymous" 
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="px-6 py-8">
              {/* Location (if any) */}
              {entry.location?.name && (
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
                  <MapPin className="w-3 h-3" />
                  <span>{entry.location.name}</span>
                </div>
              )}

              {/* Rich Text Caption */}
              <div 
                className="text-[#333333] leading-[1.8] text-[15px] prose prose-sm max-w-none prose-p:my-2"
                style={{ 
                  fontFamily: '"LXGW WenKai", serif',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
                dangerouslySetInnerHTML={{ __html: entry.caption }}
              />

              {/* Tags */}
              {((entry.tags && entry.tags.length > 0) || (entry.aiTags && entry.aiTags.length > 0)) && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {entry.tags?.map(tag => (
                    <span key={tag} className="text-xs text-[#8a8a8a] bg-[#f0f0f0] px-2.5 py-1 rounded-md">
                      #{tag}
                    </span>
                  ))}
                  {entry.aiTags?.map(tag => (
                    <span key={`ai-${tag}`} className="text-xs text-purple-600/80 bg-purple-50 px-2.5 py-1 rounded-md flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Brand & QR Code */}
            <div className="px-6 pb-8 pt-4">
              <div className="pt-6 border-t border-gray-200/60 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {/* App Logo - using the image from icons */}
                    <img 
                      src="/icons/icon-192.webp" 
                      alt="Echoes Logo" 
                      className="w-7 h-7 rounded-md object-cover shadow-sm"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 tracking-tight leading-none text-sm" style={{ fontFamily: 'sans-serif' }}>Echoes 留声日记</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 tracking-wider">记录生活中的每一个闪光时刻</span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
                    <QRCodeSVG 
                      value={window.location.origin} 
                      size={52}
                      level="L"
                      fgColor="#374151"
                    />
                  </div>
                  <span className="text-[8px] text-gray-400 transform scale-90">长按扫码记录美好</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 rounded-b-3xl z-10">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                保存精美长图
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
            保存后可直接分享至朋友圈、小红书等平台
          </p>
        </div>
      </div>
    </div>
  );
}
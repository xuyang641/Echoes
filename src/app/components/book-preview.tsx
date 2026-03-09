import { forwardRef, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, BookOpen, Move, Check, MousePointer2, AlignLeft, AlignCenter, AlignRight, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import HTMLFlipBook from 'react-pageflip';
import { DiaryEntry } from './diary-entry-form';
import { BookCustomization, ImageCustomization, PageCustomization, TextConfig } from '../types/book-customization';

interface MockBookPreviewProps {
  pages: any[];
  onClose: () => void;
  customization?: BookCustomization;
  onCustomizationChange?: (customization: BookCustomization) => void;
}

// Draggable Image Component
const EditableImage = ({ 
  src, 
  alt, 
  customization, 
  onUpdate,
  isEditMode
}: { 
  src: string, 
  alt?: string, 
  customization?: ImageCustomization,
  onUpdate?: (update: Partial<ImageCustomization>) => void,
  isEditMode?: boolean
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const scale = customization?.scale || 1;
  const offsetX = customization?.offsetX || 0;
  const offsetY = customization?.offsetY || 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onUpdate || !isEditMode) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent page flip
    setIsDragging(true);
    setStartPos({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !onUpdate) return;
    e.preventDefault();
    e.stopPropagation();
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    onUpdate({ offsetX: newX, offsetY: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!onUpdate || !isEditMode) return;
    e.stopPropagation(); // Prevent page scroll if possible, but mainly stop flip
    
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(scale + delta, 1), 3);
    onUpdate({ scale: newScale });
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onUpdate) return;
      onUpdate({ scale: parseFloat(e.target.value) });
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full overflow-hidden relative ${isEditMode && onUpdate ? 'cursor-grab active:cursor-grabbing group' : ''}`}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={src} 
        alt={alt}
        draggable={false}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{
          transform: `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="w-full h-full object-cover select-none pointer-events-none" 
      />
      
      {/* Edit Overlay Controls */}
      {isEditMode && onUpdate && (
        <>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/50 transition-colors pointer-events-none z-10"></div>
            
            {/* Zoom Slider */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Move className="w-3 h-3 text-white" />
                <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={scale} 
                    onChange={handleSliderChange}
                    onMouseDown={(e) => e.stopPropagation()} // Stop drag start
                    className="w-20 h-1 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[10px] text-white w-6 text-right">{scale.toFixed(1)}x</span>
            </div>
        </>
      )}
    </div>
  );
};

// Editable Text Component
const EditableText = ({
    initialContent,
    field,
    customization,
    onUpdate,
    className,
    style,
    isEditMode,
    placeholder
}: {
    initialContent: string,
    field: string,
    customization?: PageCustomization,
    onUpdate?: (field: string, update: Partial<TextConfig>) => void,
    className?: string,
    style?: React.CSSProperties,
    isEditMode?: boolean,
    placeholder?: string
}) => {
    const textRef = useRef<HTMLDivElement>(null);
    const config = customization?.texts?.[field];
    
    const content = config?.content ?? initialContent;
    const align = config?.align;
    const scale = config?.fontSizeScale || 1;
    
    const handleBlur = () => {
        if (!textRef.current || !onUpdate) return;
        const newContent = textRef.current.innerText;
        if (newContent !== content) {
            onUpdate(field, { content: newContent });
        }
    };

    const handleUpdate = (update: Partial<TextConfig>) => {
        if (onUpdate) onUpdate(field, update);
    };

    return (
        <div className={`relative group/text ${isEditMode ? 'hover:z-30' : ''}`}>
            <div
                ref={textRef}
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={handleBlur}
                onKeyDown={(e) => e.stopPropagation()} // Stop flip on arrow keys
                className={`${className} ${isEditMode ? 'outline-2 outline-transparent hover:outline-blue-300/50 hover:bg-blue-50/10 rounded px-1 -mx-1 transition-all cursor-text min-h-[1em]' : ''}`}
                style={{
                    ...style,
                    textAlign: align || style?.textAlign as any,
                    fontSize: style?.fontSize ? `calc(${style.fontSize} * ${scale})` : undefined,
                    transform: `scale(${scale})`, // Alternative scaling if fontSize not provided
                    transformOrigin: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'
                }}
            >
                {content || (isEditMode ? placeholder : '')}
            </div>

            {isEditMode && onUpdate && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-1.5 flex items-center gap-1 opacity-0 group-hover/text:opacity-100 transition-opacity z-50 pointer-events-auto border border-gray-100 dark:border-gray-700">
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5">
                        <button onClick={() => handleUpdate({ align: 'left' })} className={`p-1 rounded hover:bg-white dark:hover:bg-gray-600 ${align === 'left' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}><AlignLeft className="w-3 h-3" /></button>
                        <button onClick={() => handleUpdate({ align: 'center' })} className={`p-1 rounded hover:bg-white dark:hover:bg-gray-600 ${align === 'center' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}><AlignCenter className="w-3 h-3" /></button>
                        <button onClick={() => handleUpdate({ align: 'right' })} className={`p-1 rounded hover:bg-white dark:hover:bg-gray-600 ${align === 'right' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}><AlignRight className="w-3 h-3" /></button>
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-0.5">
                        <button onClick={() => handleUpdate({ fontSizeScale: Math.max(0.5, scale - 0.1) })} className="p-1 rounded hover:bg-white dark:hover:bg-gray-600"><Minus className="w-3 h-3" /></button>
                        <span className="text-[10px] w-8 text-center flex items-center justify-center font-mono">{Math.round(scale * 100)}%</span>
                        <button onClick={() => handleUpdate({ fontSizeScale: Math.min(2, scale + 0.1) })} className="p-1 rounded hover:bg-white dark:hover:bg-gray-600"><Plus className="w-3 h-3" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};


const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page bg-white shadow-md h-full" ref={ref}>
      <div className="page-content h-full relative">
        {props.children}
      </div>
    </div>
  );
});

const moodMap: Record<string, string> = {
  happy: '开心',
  sad: '难过',
  excited: '兴奋',
  calm: '平静',
  proud: '自豪',
  adventure: '冒险',
  romantic: '浪漫',
  grateful: '感恩',
  cozy: '温馨',
  hopeful: '充满希望',
  relaxed: '放松',
  angry: '生气',
  neutral: '平淡'
};

export function MockBookPreview({ pages, onClose, customization, onCustomizationChange }: MockBookPreviewProps) {
  const { t } = useTranslation();
  const bookRef = useRef<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Helper to update customization
  const updateImageCustomization = (pageIndex: number, imageIndex: number, update: Partial<ImageCustomization>) => {
    if (!onCustomizationChange || !customization) return;
    
    const pageId = pages[pageIndex]?.id || `page-${pageIndex}`;
    const currentCustomization = customization[pageId] || { images: {} };
    const currentImageConfig = currentCustomization.images[imageIndex] || { scale: 1, offsetX: 0, offsetY: 0 };

    onCustomizationChange({
      ...customization,
      [pageId]: {
        ...currentCustomization,
        images: {
          ...currentCustomization.images,
          [imageIndex]: {
            ...currentImageConfig,
            ...update
          }
        }
      }
    });
  };

  const updateTextCustomization = (pageIndex: number, field: string, update: Partial<TextConfig>) => {
    if (!onCustomizationChange || !customization) return;
    
    const pageId = pages[pageIndex]?.id || `page-${pageIndex}`;
    const currentCustomization = customization[pageId] || { images: {} };
    const currentTextConfig = currentCustomization.texts?.[field] || {};

    onCustomizationChange({
      ...customization,
      [pageId]: {
        ...currentCustomization,
        texts: {
          ...currentCustomization.texts,
          [field]: {
            ...currentTextConfig,
            ...update
          }
        }
      }
    });
  };

  const nextFlip = () => {
    if (isEditMode) return;
    bookRef.current?.pageFlip()?.flipNext();
  };

  const prevFlip = () => {
    if (isEditMode) return;
    bookRef.current?.pageFlip()?.flipPrev();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextFlip();
      if (e.key === 'ArrowLeft') prevFlip();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode]);

  const renderPageContent = (page: any, index: number) => {
    // Add null check for page
    if (!page) return <div className="w-full h-full bg-white"></div>;
    const pageId = page.id || `page-${index}`;
    const pageCustomization = customization?.[pageId];

    if (page.type === 'cover') {
      return (
        <div className="w-full h-full bg-pink-50 dark:bg-gray-800 flex flex-col items-center justify-center p-8 border-4 border-double border-pink-200 dark:border-gray-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="z-10 text-center space-y-6 w-full">
             <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg relative">
                 {page.coverPhoto ? (
                     <EditableImage 
                       src={page.coverPhoto} 
                       customization={pageCustomization?.images?.[0]}
                       onUpdate={isEditMode && onCustomizationChange ? (update) => updateImageCustomization(index, 0, update) : undefined}
                       isEditMode={isEditMode}
                     />
                 ) : (
                     <div className="w-full h-full bg-pink-200 flex items-center justify-center text-pink-500">
                         <BookOpen className="w-12 h-12" />
                     </div>
                 )}
             </div>
             <div>
                 <EditableText 
                    initialContent={page.title}
                    field="title"
                    customization={pageCustomization}
                    onUpdate={isEditMode && onCustomizationChange ? (field, update) => updateTextCustomization(index, field, update) : undefined}
                    isEditMode={isEditMode}
                    className="text-5xl font-serif font-bold text-gray-900 dark:text-white mb-2 mx-auto"
                    style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif', textAlign: 'center' }}
                 />
                 <div className="h-1 w-20 bg-pink-400 mx-auto rounded-full"></div>
             </div>
             <EditableText 
                initialContent={page.subtitle}
                field="subtitle"
                customization={pageCustomization}
                onUpdate={isEditMode && onCustomizationChange ? (field, update) => updateTextCustomization(index, field, update) : undefined}
                isEditMode={isEditMode}
                className="text-xl text-gray-600 dark:text-gray-300 font-light tracking-wide mx-auto"
                style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif', textAlign: 'center' }}
             />
          </div>
          <div className="absolute bottom-8 text-xs text-gray-400 uppercase tracking-widest">Echoes 影像日记</div>
        </div>
      );
    }

    if (page.type === 'intro') {
      const introText = (page.content || page.text || '').replace('{{year}}', page.year || '');
      
      return (
        <div className="w-full h-full bg-[#fdfbf7] p-12 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl font-serif text-gray-800 mb-8">{t('print.introduction') || '序言'}</h2>
          <EditableText 
            initialContent={introText}
            field="content"
            customization={pageCustomization}
            onUpdate={isEditMode && onCustomizationChange ? (field, update) => updateTextCustomization(index, field, update) : undefined}
            isEditMode={isEditMode}
            className="text-xl text-gray-700 italic leading-loose max-w-lg"
            style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif', textAlign: 'center' }}
          />
          <div className="mt-auto text-xs text-gray-400">{index + 1}</div>
        </div>
      );
    }

    if (page.type === 'entry') {
      const imgConfig = pageCustomization?.images?.[0];

      return (
        <div className="w-full h-full bg-[#fdfbf7] p-8 flex flex-col">
           <div className="flex justify-between items-baseline border-b border-gray-200 pb-4 mb-6">
             <h3 className="text-2xl font-bold text-gray-900">{page.date ? format(new Date(page.date), 'MMMM d') : ''}</h3>
             <span className="text-sm text-gray-500 uppercase tracking-wider">{page.location}</span>
           </div>
           <div className="w-full aspect-video bg-gray-100 mb-6 rounded-lg overflow-hidden shadow-sm relative">
             <EditableImage 
               src={page.photo} 
               customization={imgConfig}
               onUpdate={isEditMode && onCustomizationChange ? (update) => updateImageCustomization(index, 0, update) : undefined}
               isEditMode={isEditMode}
             />
           </div>
           <EditableText 
             initialContent={page.caption}
             field="caption"
             customization={pageCustomization}
             onUpdate={isEditMode && onCustomizationChange ? (field, update) => updateTextCustomization(index, field, update) : undefined}
             isEditMode={isEditMode}
             className="text-gray-800 font-serif text-lg leading-loose line-clamp-[8]"
             style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif', textAlign: 'justify' }}
           />
           <div className="mt-auto pt-4 flex justify-between items-center">
             <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">心情: {moodMap[page.mood] || page.mood}</span>
             <span className="text-xs text-gray-400">{index + 1}</span>
           </div>
        </div>
      );
    }

    if (page.type === 'grid' || page.type === 'grid-2x2') {
        return (
          <div className="w-full h-full bg-[#fdfbf7] p-8 flex flex-col">
            <div className={`grid gap-4 flex-1 content-start ${page.layout === 'grid-4' || page.type === 'grid-2x2' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-2'}`}>
               {page.photos?.map((photo: string, i: number) => (
                 <div key={i} className="relative group rounded-lg overflow-hidden shadow-sm aspect-square bg-gray-100">
                   <EditableImage 
                      src={photo} 
                      customization={pageCustomization?.images?.[i]}
                      onUpdate={isEditMode && onCustomizationChange ? (update) => updateImageCustomization(index, i, update) : undefined}
                      isEditMode={isEditMode}
                   />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-2 pointer-events-none">
                       <span className="text-xs text-white opacity-0 group-hover:opacity-100 truncate w-full" style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif' }}>{page.captions?.[i]}</span>
                   </div>
                 </div>
               ))}
               {/* Fallback for 'grid' type which uses entries */}
               {!page.photos && page.entries?.map((entry: DiaryEntry, i: number) => (
                 <div key={i} className="relative group rounded-lg overflow-hidden shadow-sm aspect-square bg-gray-100">
                   <EditableImage 
                      src={entry.photo} 
                      customization={pageCustomization?.images?.[i]}
                      onUpdate={isEditMode && onCustomizationChange ? (update) => updateImageCustomization(index, i, update) : undefined}
                      isEditMode={isEditMode}
                   />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-2 pointer-events-none">
                       <span className="text-xs text-white opacity-0 group-hover:opacity-100 truncate w-full" style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif' }}>{entry.caption}</span>
                   </div>
                 </div>
               ))}
            </div>
            <div className="mt-auto text-right text-xs text-gray-400 pt-4">{index + 1}</div>
          </div>
        );
      }

    if (page.type === 'collage') {
      // Magazine Style Layout
      const photos = page.entries || [];
      const mainPhoto = photos[0];
      const otherPhotos = photos.slice(1);
      
      return (
        <div className="w-full h-full bg-[#fdfbf7] p-0 flex flex-col relative overflow-hidden">
          {/* Full bleed top photo */}
          <div className="h-1/2 w-full relative">
             <EditableImage 
                src={mainPhoto?.photo} 
                customization={pageCustomization?.images?.[0]}
                onUpdate={isEditMode && onCustomizationChange ? (update) => updateImageCustomization(index, 0, update) : undefined}
                isEditMode={isEditMode}
             />
             <div className="absolute bottom-0 left-0 bg-white px-6 py-3 rounded-tr-xl pointer-events-none">
                <span className="font-serif italic text-2xl">{mainPhoto?.date ? format(new Date(mainPhoto.date), 'MMM d') : ''}</span>
             </div>
          </div>
          
          <div className="flex-1 p-8 flex gap-6">
             <div className="flex-1 space-y-4">
                <EditableText 
                    initialContent={page.caption}
                    field="caption"
                    customization={pageCustomization}
                    onUpdate={isEditMode && onCustomizationChange ? (field, update) => updateTextCustomization(index, field, update) : undefined}
                    isEditMode={isEditMode}
                    className="text-base font-serif leading-loose text-gray-800 text-justify first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-gray-900"
                    style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif', textAlign: 'justify' }}
                />
             </div>
             <div className="w-1/3 flex flex-col gap-3">
                 {otherPhotos.map((p: DiaryEntry, i: number) => (
                     <div key={i} className="flex-1 bg-gray-100 rounded-lg overflow-hidden shadow-sm relative">
                         <EditableImage 
                            src={p.photo} 
                            customization={pageCustomization?.images?.[i + 1]}
                            onUpdate={isEditMode && onCustomizationChange ? (update) => updateImageCustomization(index, i + 1, update) : undefined}
                            isEditMode={isEditMode}
                         />
                     </div>
                 ))}
             </div>
          </div>
          
          <div className="absolute bottom-4 right-6 text-xs text-gray-400">{index + 1}</div>
        </div>
      );
    }

    if (page.type === 'photo-full' || page.type === 'photo-left' || page.type === 'photo-right') {
      return (
        <div className={`w-full h-full bg-white dark:bg-gray-50 flex flex-col p-10 relative overflow-hidden ${page.type === 'photo-left' ? 'items-start' : page.type === 'photo-right' ? 'items-end' : 'items-center'}`}>
          {/* Photo Frame */}
          <div className={`w-full aspect-[4/3] bg-gray-100 mb-8 overflow-hidden shadow-md border-8 border-white ${page.type === 'photo-left' || page.type === 'photo-right' ? 'w-5/6' : ''} relative`}>
             {page.photos && page.photos[0] ? (
               <EditableImage 
                  src={page.photos[0]} 
                  customization={pageCustomization?.images?.[0]}
                  onUpdate={isEditMode && onCustomizationChange ? (update) => updateImageCustomization(index, 0, update) : undefined}
                  isEditMode={isEditMode}
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-300">No Photo</div>
             )}
          </div>
          
          {/* Text Content */}
          <div className={`w-full space-y-4 ${page.type === 'photo-left' || page.type === 'photo-right' ? 'text-left px-2' : 'text-center'}`}>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{page.date}</div>
              {page.caption && (
                  <EditableText 
                    initialContent={page.caption}
                    field="caption"
                    customization={pageCustomization}
                    onUpdate={isEditMode && onCustomizationChange ? (field, update) => updateTextCustomization(index, field, update) : undefined}
                    isEditMode={isEditMode}
                    className="font-serif text-2xl text-gray-900 italic"
                    style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif', textAlign: page.type === 'photo-left' || page.type === 'photo-right' ? 'left' : 'center' }}
                 />
              )}
              {page.content && (
                  <EditableText 
                    initialContent={page.content}
                    field="content"
                    customization={pageCustomization}
                    onUpdate={isEditMode && onCustomizationChange ? (field, update) => updateTextCustomization(index, field, update) : undefined}
                    isEditMode={isEditMode}
                    className="text-lg text-gray-700 leading-loose font-light mt-6 line-clamp-6 whitespace-pre-wrap text-justify"
                    style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif', textAlign: 'justify' }}
                 />
              )}
          </div>
          
          {/* Page Number */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400">
             — {index + 1} —
          </div>
        </div>
      );
    }
    
    if (page.type === 'outro') {
        return (
            <div className="w-full h-full bg-[#fdfbf7] p-12 flex flex-col items-center justify-center text-center">
              <EditableText 
                initialContent={page.text}
                field="text"
                customization={pageCustomization}
                onUpdate={isEditMode && onCustomizationChange ? (field, update) => updateTextCustomization(index, field, update) : undefined}
                isEditMode={isEditMode}
                className="text-3xl font-serif italic text-gray-600"
                style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif', textAlign: 'center' }}
              />
              <div className="mt-auto text-xs text-gray-400">{index + 1}</div>
            </div>
        );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-50">
        <X className="w-8 h-8" />
      </button>

      {/* Edit Mode Toggle */}
      {onCustomizationChange && (
        <div className="absolute top-4 left-4 z-50 flex gap-2">
           <button 
             onClick={() => setIsEditMode(!isEditMode)}
             className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 transition-all ${
                isEditMode 
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400' 
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'
             }`}
           >
             {isEditMode ? <Check className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
             {isEditMode ? '完成编辑' : '调整内容'}
           </button>
           
           {isEditMode && (
               <div className="px-4 py-2 bg-black/60 text-white text-sm rounded-full backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                   <span>点击文字修改 • 拖拽图片 • 滚轮/滑块缩放</span>
               </div>
           )}
        </div>
      )}

      <div className="relative w-full h-full flex items-center justify-center">
        {/* @ts-ignore - Library types might be tricky */}
        <HTMLFlipBook
          width={450}
          height={600}
          size="stretch"
          minWidth={300}
          maxWidth={600}
          minHeight={400}
          maxHeight={800}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={!isEditMode}
          useMouseEvents={!isEditMode}
          className="shadow-2xl"
          ref={bookRef}
        >
            {/* Front Cover */}
            <Page>
                {renderPageContent(pages[0], 0)}
            </Page>

            {/* Inner Pages */}
            {pages.slice(1).map((page, index) => (
                <Page key={index}>
                    {renderPageContent(page, index + 1)}
                </Page>
            ))}

            {/* Back Cover */}
            <Page>
                <div className="w-full h-full bg-blue-900 text-white flex flex-col items-center justify-center border-8 border-blue-950 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 pointer-events-none"></div>
                    <div className="z-10 text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-amber-100" />
                        </div>
                        <p className="text-sm opacity-60">全书完</p>
                        <p className="text-xs opacity-40 mt-2">www.photodiary.com</p>
                    </div>
                </div>
            </Page>
        </HTMLFlipBook>
      </div>
      
      {!isEditMode && (
        <div className="absolute bottom-8 text-white/50 text-sm bg-black/50 px-4 py-2 rounded-full pointer-events-none">
          {t('print.flipInstruction') || '点击角落或使用方向键翻页'}
        </div>
      )}
    </div>
  );
}
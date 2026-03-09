import { useState, useMemo, useEffect } from 'react';
import { Book, Check, Printer, Camera, FileText, ShoppingBag, BookOpen, AlertCircle, Share2, Download, Layout, Edit3, GripVertical, Image as ImageIcon, ArrowRight, Globe, Eye } from 'lucide-react';
import { DiaryEntry } from './diary-entry-form';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { LazyImage } from './ui/lazy-image';
import { toast } from 'react-hot-toast';
import { generateBookLayout, LayoutStyle } from '../utils/layout-engine';
import { generatePDF } from '../utils/pdf-generator';
import { useSearchParams } from 'react-router-dom';
import { shareBook } from '../services/book-service';
import { MockBookPreview } from './book-preview';
import { Reorder } from 'framer-motion';
import { Checkbox } from '../components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

import { BookCustomization } from '../types/book-customization';

interface PrintShopViewProps {
  entries?: DiaryEntry[];
}

export function PrintShopView({ entries = [] }: PrintShopViewProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Customization State
  const [customization, setCustomization] = useState<BookCustomization>({});
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const urlYear = searchParams.get('year');
    if (urlYear) return urlYear;
    try {
      return new Date().getFullYear().toString();
    } catch (e) {
      return '2025';
    }
  });
  
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>(() => {
    const urlStyle = searchParams.get('style');
    return (urlStyle as LayoutStyle) || 'classic';
  });

  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(() => {
    return searchParams.get('mode') === 'preview';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error] = useState<string | null>(null);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customOrderedEntries, setCustomOrderedEntries] = useState<DiaryEntry[]>([]);
  const [excludedEntryIds, setExcludedEntryIds] = useState<Set<string>>(new Set());
  const [customCoverPhoto, setCustomCoverPhoto] = useState<string | null>(null);
  
  // Example Book Data
  const [showExample, setShowExample] = useState(false);
  const exampleEntries: DiaryEntry[] = useMemo(() => [
    { 
        id: 'ex1', 
        date: '2024-02-09T18:00:00Z', 
        content: '除夕之夜，万家灯火。一家人围坐在一起包饺子，看着春晚，聊着这一年的家长里短。窗外鞭炮声此起彼伏，空气中弥漫着硝烟和食物的香气。这一刻的团圆，是对过去一年最好的慰藉。愿新的一年，平安喜乐，万事胜意。', 
        photo: 'https://images.unsplash.com/photo-1576014131795-d440191a8e8b?w=800&q=80', 
        mood: 'happy', 
        caption: '除夕团圆' 
    },
    { 
        id: 'ex2', 
        date: '2024-02-24T20:00:00Z', 
        content: '元宵佳节，花灯如昼。漫步在古镇的街道上，头顶是各式各样的彩灯，猜灯谜的人群熙熙攘攘。吃上一碗热气腾腾的汤圆，软糯香甜，寓意着团团圆圆。月上柳梢头，人约黄昏后，今夜的月色格外温柔。', 
        photo: 'https://images.unsplash.com/photo-1516233758813-a38d024919c5?w=800&q=80', 
        mood: 'excited', 
        caption: '元宵花灯' 
    },
    { 
        id: 'ex3', 
        date: '2024-03-08T09:00:00Z', 
        content: '在这个属于女性的节日里，给自己买了一束鲜花。生活需要仪式感，不仅是为了取悦他人，更是为了宠爱自己。看着办公桌上绽放的花朵，心情也变得明媚起来。愿每一位女性都能活出自我，如花般绽放。', 
        photo: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=800&q=80', 
        mood: 'happy', 
        caption: '女神节快乐' 
    },
    { 
        id: 'ex4', 
        date: '2024-04-04T10:00:00Z', 
        content: '清明时节雨纷纷，路上行人欲断魂。回乡祭祖，踏青扫墓。山间的空气清新湿润，新绿的柳枝在风中摇曳。慎终追远，不仅是对先人的缅怀，更是对生命的敬畏。珍惜当下，不负韶华。', 
        photo: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&q=80', 
        mood: 'calm', 
        caption: '清明踏青' 
    },
    { 
        id: 'ex5', 
        date: '2024-05-01T14:00:00Z', 
        content: '五一小长假，逃离城市的喧嚣，去山野间寻找久违的宁静。搭起帐篷，生起篝火，看漫天繁星闪烁。没有工作的烦恼，只有风声和虫鸣。劳动是为了更好地生活，而休息是为了走更远的路。', 
        photo: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80', 
        mood: 'relaxed', 
        caption: '五一露营' 
    },
    { 
        id: 'ex6', 
        date: '2024-06-10T11:00:00Z', 
        content: '端午安康，粽叶飘香。妈妈亲手包的肉粽，永远是记忆中最美味的味道。赛龙舟的鼓声震天响，江面上百舸争流，热闹非凡。传统节日的魅力，在于那份传承千年的文化底蕴和浓浓的人情味。', 
        photo: 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?w=800&q=80', 
        mood: 'happy', 
        caption: '端午龙舟' 
    },
    { 
        id: 'ex7', 
        date: '2024-07-01T15:00:00Z', 
        content: '七月流火，夏日炎炎。躲进书店的一角，点一杯冰咖啡，翻看一本心仪已久的小说。窗外是刺眼的阳光和知了的叫声，室内却是清凉静谧的世界。阅读，是心灵的避暑胜地。', 
        photo: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80', 
        mood: 'calm', 
        caption: '夏日书香' 
    },
    { 
        id: 'ex8', 
        date: '2024-08-10T20:00:00Z', 
        content: '七夕今宵看碧霄，牵牛织女渡河桥。和心爱的人漫步在江边，看着对岸的灯光秀，许下关于未来的承诺。爱情不需要轰轰烈烈，只需要细水长流的陪伴。愿天下有情人终成眷属。', 
        photo: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80', 
        mood: 'romantic', 
        caption: '七夕乞巧' 
    },
    { 
        id: 'ex9', 
        date: '2024-09-17T19:00:00Z', 
        content: '中秋月圆，人团圆。一家人围坐在院子里，吃着月饼，赏着明月。桂花飘香，秋风送爽。小时候不识月，呼作白玉盘。如今才明白，这轮明月寄托了多少游子的思乡之情。', 
        photo: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800&q=80', 
        mood: 'grateful', 
        caption: '中秋赏月' 
    },
    { 
        id: 'ex10', 
        date: '2024-10-01T10:00:00Z', 
        content: '国庆长假，开启一场期待已久的自驾游。沿着最美的公路，看尽祖国的大好河山。金秋十月，层林尽染，每一处风景都如诗如画。在旅途中发现未知的自己，感受世界的辽阔。', 
        photo: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80', 
        mood: 'excited', 
        caption: '金秋自驾' 
    },
    { 
        id: 'ex11', 
        date: '2024-11-22T12:00:00Z', 
        content: '小雪节气，气温骤降。煮一壶热茶，烤几个红薯，暖手暖胃又暖心。冬天的快乐其实很简单，也许就是那一抹温暖的阳光，或者是一顿热气腾腾的火锅。在这个寒冷的季节里，学会温暖自己。', 
        photo: 'https://images.unsplash.com/photo-1515446134809-993c501ca304?w=800&q=80', 
        mood: 'cozy', 
        caption: '小雪围炉' 
    },
    { 
        id: 'ex12', 
        date: '2024-12-31T23:59:00Z', 
        content: '站在年末的尾巴上，回望这一年。有欢笑也有泪水，有收获也有遗憾。但无论如何，我们都勇敢地走过来了。倒计时的钟声即将敲响，让我们挥手告别过去，满怀期待地迎接崭新的2025。新年快乐！', 
        photo: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80', 
        mood: 'hopeful', 
        caption: '跨年倒数' 
    },
  ], []);

  const exampleBookPages = useMemo(() => {
    return generateBookLayout(exampleEntries, '2024', layoutStyle, (key, defaultValue) => t(key, defaultValue || key) as string);
  }, [exampleEntries, layoutStyle, t]);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('year', selectedYear);
    params.set('style', layoutStyle);
    if (isPreviewOpen) {
      params.set('mode', 'preview');
    } else {
      params.delete('mode');
    }
    setSearchParams(params, { replace: true });
  }, [selectedYear, layoutStyle, isPreviewOpen]);

  // Defensive: Ensure entries is an array
  const safeEntries = useMemo(() => {
    return Array.isArray(entries) ? entries : [];
  }, [entries]);

  // Available years calculation with error handling
  const years = useMemo(() => {
    try {
      const uniqueYears = new Set(safeEntries
        .filter(e => e && e.date && typeof e.date === 'string' && !isNaN(new Date(e.date).getTime()))
        .map(e => new Date(e.date).getFullYear().toString())
      );
      const sortedYears = Array.from(uniqueYears).sort().reverse();
      if (sortedYears.length === 0) return [new Date().getFullYear().toString()];
      return sortedYears;
    } catch (e) {
      console.error("Error calculating years:", e);
      return [new Date().getFullYear().toString()];
    }
  }, [safeEntries]);

  // Filter entries for selected year
  const yearEntries = useMemo(() => {
    return safeEntries.filter(entry => {
      try {
        if (!entry || !entry.date) return false;
        return new Date(entry.date).getFullYear().toString() === selectedYear;
      } catch (e) {
        return false;
      }
    });
  }, [safeEntries, selectedYear]);

  // Initialize custom order when year changes
  useEffect(() => {
    setCustomOrderedEntries(yearEntries);
    setExcludedEntryIds(new Set());
    setCustomCoverPhoto(null);
  }, [yearEntries]);

  const finalEntries = useMemo(() => {
    // Filter out excluded IDs
    return customOrderedEntries.filter(e => !excludedEntryIds.has(e.id));
  }, [customOrderedEntries, excludedEntryIds]);

  const bookPages = useMemo(() => {
    if (finalEntries.length === 0) return [];
    
    // Generate pages
    const pages = generateBookLayout(finalEntries, selectedYear, layoutStyle, (key, defaultValue) => t(key, defaultValue || key) as string);
    
    // Override cover photo if custom selected
    if (customCoverPhoto && pages.length > 0 && pages[0].type === 'cover') {
        pages[0].coverPhoto = customCoverPhoto;
    }
    
    return pages;
  }, [finalEntries, selectedYear, layoutStyle, t, customCoverPhoto]);

  // Calculate stats safely
  const photoCount = finalEntries.reduce((acc, entry) => acc + (entry?.photo ? 1 : 0), 0);
  const displayPhotoCount = photoCount > 0 ? photoCount : 0;
  const displayPages = bookPages.length;

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      setShowOrderSuccess(true);
    } catch (e) {
      console.error(e);
      toast.error(t('common.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
     setIsGenerating(true);
     toast.loading(t('print.generating'), { id: 'pdf-gen' });

     try {
         const doc = await generatePDF(bookPages, selectedYear, t, (progress) => {
             toast.loading(`${t('print.generating')} (${Math.round(progress * 100)}%)`, { id: 'pdf-gen' });
         });
         
         doc.save(`PhotoDiary-${selectedYear}-${layoutStyle}.pdf`);
         toast.success(t('common.success'), { id: 'pdf-gen' });
         setShowOrderSuccess(false); // Close modal on success
         
     } catch (e) {
         console.error(e);
         toast.error(t('export.failed'), { id: 'pdf-gen' });
     } finally {
         setIsGenerating(false);
     }
  };


  const handleShareOnline = async () => {
    try {
        setIsSharing(true);
        toast.loading(t('print.sharing') || 'Publishing book...', { id: 'share-book' });
        
        const sharedBook = await shareBook(selectedYear, layoutStyle, bookPages);
        
        // Construct public link
        const url = `${window.location.origin}/share/book/${sharedBook.id}`;
        
        navigator.clipboard.writeText(url).then(() => {
            toast.success(t('print.linkCopied') || 'Link copied!', { id: 'share-book', duration: 4000 });
        });
        
        setShowOrderSuccess(false);
    } catch (e) {
        console.error(e);
        toast.error(t('common.error') || 'Failed to share', { id: 'share-book' });
    } finally {
        setIsSharing(false);
    }
  };

  const toggleEntrySelection = (id: string) => {
    const newSet = new Set(excludedEntryIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setExcludedEntryIds(newSet);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500 p-4">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-bold">Something went wrong</h3>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 rounded-lg hover:bg-red-200"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Editor Overlay */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm z-10">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-blue-600" />
                        {t('print.editorTitle') || 'Customize Book Content'}
                    </h2>
                    <p className="text-sm text-gray-500">{finalEntries.length} photos selected</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsEditorOpen(false)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        {t('common.done') || 'Done'}
                    </button>
                </div>
            </div>

            {/* Main Content - Two Columns */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Reorderable List */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                            <span>Drag to reorder • Uncheck to remove</span>
                        </div>
                        
                        <Reorder.Group axis="y" values={customOrderedEntries} onReorder={setCustomOrderedEntries} className="space-y-3">
                            {customOrderedEntries.map((entry) => (
                                <Reorder.Item key={entry.id} value={entry} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group cursor-grab active:cursor-grabbing">
                                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            {entry.photo && <img src={entry.photo} className={`w-full h-full object-cover transition-opacity ${excludedEntryIds.has(entry.id) ? 'opacity-30 grayscale' : ''}`} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-gray-900 dark:text-gray-100">{format(new Date(entry.date), 'MMM d, yyyy')}</div>
                                            <div className="text-sm text-gray-500 truncate">{entry.caption || 'No caption'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Cover Selection */}
                                        <button 
                                            onClick={() => setCustomCoverPhoto(entry.photo)}
                                            className={`p-2 rounded-lg text-xs font-medium transition-colors ${customCoverPhoto === entry.photo ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                            title="Set as Cover Photo"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                        </button>

                                        {/* Include/Exclude Toggle */}
                                        <Checkbox 
                                            checked={!excludedEntryIds.has(entry.id)}
                                            onCheckedChange={() => toggleEntrySelection(entry.id)}
                                        />
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400">
          回忆冲印店
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          将珍贵的数字记忆，印制成触手可及的精美相册。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            id: 'classic',
            title: '经典年鉴 (Classic)',
            description: '永恒的经典设计，适合珍藏全年的美好回忆。',
            image: 'https://images.unsplash.com/photo-1629196914375-f7e48f477b6d?w=600&q=80',
            color: 'bg-blue-50 text-blue-600',
            icon: <Book className="w-6 h-6" />
          },
          {
            id: 'grid',
            title: '现代网格 (Grid)',
            description: '类似 Instagram 的网格排版，清晰展示每一张照片。',
            image: 'https://images.unsplash.com/photo-1616628188859-7a11abb6fcc9?w=600&q=80',
            color: 'bg-pink-50 text-pink-600',
            icon: <Layout className="w-6 h-6" />
          },
          {
            id: 'magazine',
            title: '杂志风 (Magazine)',
            description: '大图与文字的完美结合，像时尚杂志一样讲述你的故事。',
            image: 'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=600&q=80',
            color: 'bg-purple-50 text-purple-600',
            icon: <FileText className="w-6 h-6" />
          }
        ].map((template) => (
          <div 
            key={template.id}
            onClick={() => setLayoutStyle(template.id as LayoutStyle)}
            className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
              layoutStyle === template.id 
                ? 'border-pink-500 shadow-xl scale-[1.02]' 
                : 'border-transparent hover:border-pink-200 dark:hover:border-pink-900 shadow-lg hover:shadow-xl hover:scale-[1.01]'
            }`}
          >
            <div className="aspect-[4/3] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img 
                src={template.image} 
                alt={template.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute bottom-4 left-4 z-20 text-white">
                <div className={`w-10 h-10 rounded-full ${template.color} bg-white flex items-center justify-center mb-2 shadow-lg`}>
                  {template.icon}
                </div>
                <h3 className="text-xl font-bold">{template.title}</h3>
              </div>
              {layoutStyle === template.id && (
                <div className="absolute top-4 right-4 z-20 bg-pink-500 text-white p-2 rounded-full shadow-lg">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 h-10">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                 <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {template.id === 'classic' ? '最畅销' : '热门'}
                 </span>
                 <button className={`text-sm font-bold ${layoutStyle === template.id ? 'text-pink-600' : 'text-gray-900 dark:text-white group-hover:text-pink-600'} transition-colors flex items-center gap-1`}>
                    选择 <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor & Preview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pt-8 border-t border-gray-100 dark:border-gray-800">
        {/* Left: 3D Book Preview */}
        <div className="flex flex-col items-center">
          <div className="relative group perspective-1000 cursor-pointer" onClick={() => {
            setShowExample(false);
            setIsPreviewOpen(true);
          }}>
            <div className={`relative w-80 h-[480px] mx-auto transition-transform duration-700 transform-style-3d rotate-y-12 group-hover:rotate-y-0 group-hover:scale-105`}>
            {/* Front Cover */}
            <div className="absolute inset-0 bg-blue-900 rounded-r-lg shadow-2xl flex flex-col items-center justify-center p-8 text-center text-white backface-hidden z-20 border-l-4 border-l-gray-800">
              <div className="w-full h-full border-2 border-amber-400/30 p-6 flex flex-col items-center relative overflow-hidden">
                 {/* Texture overlay */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 pointer-events-none"></div>
                 
                <div className="mt-8 text-xs tracking-[0.2em] text-amber-400 uppercase relative z-10">{t('print.yearBook') || '年度相册'}</div>
                <div className="mt-4 text-6xl font-serif font-bold text-amber-100 relative z-10">{selectedYear}</div>
                <div className="mt-auto mb-12 space-y-2 relative z-10 w-full">
                  <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white/20 mx-auto shadow-inner flex items-center justify-center relative">
                     {/* Use the first photo of the year as cover if available */}
                     {yearEntries[0]?.photo ? (
                       <LazyImage src={yearEntries[0].photo} alt="Cover" className="w-full h-full object-cover opacity-80" />
                     ) : (
                       <LazyImage src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&auto=format&fit=crop&q=60" alt="Default Cover" className="w-full h-full object-cover opacity-80" />
                     )}
                  </div>
                  <p className="font-serif text-lg italic text-amber-100/80">{t('print.myPhotoDiary') || '我的影像日记'}</p>
                </div>
              </div>
              
              {/* Spine Effect */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-900 to-transparent opacity-50"></div>
            </div>

            {/* Pages Effect (Side) */}
            <div className="absolute right-0 top-2 bottom-2 w-12 bg-white transform rotate-y-90 origin-right translate-x-full shadow-inner flex flex-col justify-between py-1">
               {[...Array(20)].map((_, i) => (
                 <div key={i} className="h-px bg-gray-200 w-full"></div>
               ))}
            </div>
            
            {/* Back Cover (Simulated) */}
            <div className="absolute inset-0 bg-blue-900 rounded-l-lg transform translate-z-[-40px] shadow-xl"></div>
          </div>
          
          {/* Shadow */}
          <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-64 h-8 bg-black/20 blur-xl rounded-[100%] transition-all duration-700 group-hover:scale-110 group-hover:bg-black/30"></div>
          
           {/* Preview Badge */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
            <div className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>点击预览</span>
            </div>
          </div>
        </div>
        
        {/* Example Button - Below the book */}
        <div className="text-center mt-8">
            <button 
              onClick={() => {
                setShowExample(true);
                setIsPreviewOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 text-pink-600 border border-pink-200 dark:border-pink-900 rounded-full text-sm font-medium hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:scale-105 transition-all shadow-sm hover:shadow-md"
            >
              <Eye className="w-4 h-4" />
              预览示例效果
            </button>
        </div>
        </div>

        {/* Right: Configuration & Stats */}
        <div className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                <Camera className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{t('print.photos') || '照片数量'}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{displayPhotoCount}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{t('print.pages') || '页数'}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{displayPages}</div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('print.selectYear') || '选择年份'}</label>
              <div className="flex flex-wrap gap-2">
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedYear === year
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('print.content') || '内容选择'}</label>
                    <button 
                        onClick={() => setIsEditorOpen(true)}
                        className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                    >
                        <Edit3 className="w-3 h-3" />
                        {t('print.customize') || '自定义编辑'}
                    </button>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm">
                        <span className="font-bold text-gray-900 dark:text-white">{finalEntries.length}</span> 张照片已选
                    </div>
                    {customCoverPhoto && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                            <ImageIcon className="w-3 h-3" />
                            {t('print.customCover') || '自定义封面'}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('print.format') || '格式'}</label>
              <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      {t('print.photobook') || '精装照片书'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('print.formatDesc') || 'A4 尺寸，高品质铜版纸印刷，硬壳精装。'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 text-lg">{t('print.free') || '免费'}</div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 text-blue-500 opacity-0">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Print Area */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            
            <button 
              onClick={handlePrint}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <Printer className="w-5 h-5" />}
                一键下单生成
              </button>
              <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                免费下载数字版 & 支持高清 PDF 打印
              </p>
            </div>
        </div>
      </div>

      <AlertDialog open={showOrderSuccess} onOpenChange={setShowOrderSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-6 h-6" />
              生成成功！
            </AlertDialogTitle>
            <AlertDialogDescription>
              您的照片书已生成完毕，您可以选择下载 PDF 打印或分享给朋友。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 flex-col sm:flex-row">
             <button
               onClick={downloadPDF}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
             >
               <Download className="w-4 h-4" />
               下载 PDF
             </button>
             
             <button
               onClick={handleShareOnline}
               disabled={isSharing}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
             >
               {isSharing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Globe className="w-4 h-4" />}
               在线分享
             </button>

             <button
               onClick={() => {
                 // Create deep link to this specific book configuration (Local only)
                 const url = new URL(window.location.href);
                 url.searchParams.set('year', selectedYear);
                 url.searchParams.set('style', layoutStyle);
                 url.searchParams.set('mode', 'preview'); // Auto-open preview
                 
                 navigator.clipboard.writeText(url.toString()).then(() => {
                    toast.success('本地链接已复制', {
                        icon: '🔗',
                        duration: 4000
                    });
                 }).catch(() => {
                    toast.error('复制失败');
                 });
                 setShowOrderSuccess(false);
               }}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
             >
               <Share2 className="w-4 h-4" />
               复制链接
             </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Book Preview Modal */}
      {isPreviewOpen && (
        <MockBookPreview 
          pages={showExample ? exampleBookPages : bookPages}
          customization={showExample ? {} : customization}
          onCustomizationChange={showExample ? undefined : setCustomization}
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}
    </div>
  );
}


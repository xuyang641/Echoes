import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, RefreshCw, PenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROMPTS = [
  "今天哪一瞬间让你觉得很放松？",
  "如果给今天选一首BGM，会是哪首？",
  "今天有没有发生什么意料之外的小惊喜？",
  "现在最想感激的人或事物是什么？",
  "如果把今天画成一幅画，会是什么颜色？",
  "今天有没有学到什么新的小知识？",
  "此刻你的身体感觉怎么样？",
  "今天吃到的最好吃的东西是什么？",
  "有什么一直想做但今天终于迈出第一步的事？",
  "如果可以对明天的自己说一句话，你会说什么？"
];

export function DailyPromptWidget() {
  const navigate = useNavigate();
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [isAnimating, setIsAnimating] = useState(false);

  const currentPrompt = PROMPTS[promptIndex];

  const handleChangePrompt = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setIsAnimating(true);
    setTimeout(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * PROMPTS.length);
      } while (newIndex === promptIndex && PROMPTS.length > 1);
      setPromptIndex(newIndex);
      setIsAnimating(false);
    }, 200);
  };

  const handleWrite = () => {
    // Format the prompt as a nice quote block or bold text for the editor
    const formattedPrompt = `<blockquote><p><em>${currentPrompt}</em></p></blockquote><p></p>`;
    navigate(`/add?prompt=${encodeURIComponent(formattedPrompt)}`);
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">每日灵感</h4>
        </div>
        <button 
          onClick={handleChangePrompt}
          className="text-[10px] font-bold flex items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors"
          title="换一个"
        >
          <RefreshCw className={`w-3 h-3 ${isAnimating ? 'animate-spin' : ''}`} />
          换一个
        </button>
      </div>
      
      <div 
        onClick={handleWrite}
        className="relative overflow-hidden bg-gradient-to-br from-orange-50/80 to-rose-50/80 dark:from-orange-900/20 dark:to-rose-900/20 rounded-2xl p-4 border border-orange-100/50 dark:border-orange-800/30 cursor-pointer hover:shadow-md transition-all group-hover:-translate-y-0.5"
      >
        {/* Decorative background element */}
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/40 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={promptIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="min-h-[3rem] flex items-center"
          >
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
              "{currentPrompt}"
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400/70">
            点击记录此刻
          </span>
          <div className="w-6 h-6 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center text-orange-500 shadow-sm border border-orange-100 dark:border-orange-800/50">
            <PenLine className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

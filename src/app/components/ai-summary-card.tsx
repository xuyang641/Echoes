import { useState } from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { aiService } from '../utils/ai-service';
import { DiaryEntry } from './diary-entry-form';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface AISummaryCardProps {
  entries: DiaryEntry[];
  date: string; // ISO date string for "today"
}

export function AISummaryCard({ entries, date }: AISummaryCardProps) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter entries for the specific date
  const todayEntries = entries.filter(e => e.date.startsWith(date.split('T')[0]));

  const handleGenerateSummary = async () => {
    if (todayEntries.length === 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (!aiService.isConfigured()) {
        throw new Error(t('ai.not_configured', 'AI service not configured'));
      }

      // Construct a specific prompt for daily summary
      const context = todayEntries.map(e => 
        `[${new Date(e.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}] ${e.mood}: ${e.caption}`
      ).join('\n');

      const prompt = `
        请阅读我今天的几条日记，为我生成一段温暖、有洞察力的“今日总结”。
        
        [今日日记]
        ${context}

        要求：
        1. 语气像一位老朋友，温柔且富有哲理。
        2. 不要只是罗列发生了什么，要提炼出今天的情绪主线或生活的小确幸。
        3. 篇幅控制在 100 字左右。
        4. 可以适当引用日记中的细节（如特定的食物、风景）。
        5. 结尾给一句简短的鼓励或晚安语。
      `;

      // We use a "hack" to bypass the generateResponse structure which is chat-oriented
      // Ideally AIService should expose a raw method, but generateResponse is fine if we frame the query right.
      // We'll just pass the prompt as the "query"
      
      const response = await aiService.generateResponse(prompt, [], 'Neutral');
      setSummary(response);
    } catch (err) {
      console.error(err);
      setError(t('ai.error', 'Failed to generate summary'));
    } finally {
      setIsLoading(false);
    }
  };

  if (todayEntries.length === 0) return null;

  return (
    <div className="mb-6">
      <AnimatePresence mode="wait">
        {!summary && !isLoading && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            onClick={handleGenerateSummary}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 border border-violet-200 dark:border-violet-700/50 flex items-center justify-between group hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-white/10 rounded-full text-violet-600 dark:text-violet-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-violet-900 dark:text-violet-100">
                  {t('ai.generate_summary', '生成今日回顾')}
                </div>
                <div className="text-xs text-violet-700 dark:text-violet-300/80">
                  {t('ai.summary_desc', '让 AI 为你的一天写下注脚')}
                </div>
              </div>
            </div>
            <div className="text-violet-400 group-hover:translate-x-1 transition-transform">
              →
            </div>
          </motion.button>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center text-center gap-3"
          >
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 animate-pulse">
              {t('ai.thinking', 'AI 正在整理你的回忆...')}
            </p>
          </motion.div>
        )}

        {summary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full p-6 rounded-2xl bg-gradient-to-br from-white to-violet-50 dark:from-gray-800 dark:to-violet-900/20 border border-violet-100 dark:border-violet-800/50 shadow-sm overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 text-violet-500" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-violet-900 dark:text-violet-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('ai.daily_summary', '今日·回响')}
                </h3>
                <button 
                  onClick={handleGenerateSummary} 
                  className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-800 rounded-full text-violet-400 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="prose prose-violet dark:prose-invert prose-sm max-w-none font-serif leading-relaxed">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

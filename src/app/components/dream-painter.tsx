import { useState } from 'react';
import { Wand2, Image as ImageIcon, Loader2, Sparkles, Download, Check } from 'lucide-react';
import { aiService } from '../utils/ai-service';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface DreamPainterProps {
  description: string;
  onImageGenerated: (url: string) => void;
}

export function DreamPainter({ description, onImageGenerated }: DreamPainterProps) {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = async () => {
    // If prompt is empty, use description, but we need to translate/summarize it to English prompt first for better results
    // For simplicity, we use the description directly or ask AI to refine it
    let finalPrompt = prompt || description;
    
    if (!finalPrompt.trim()) {
        toast.error('请先写一点日记内容，或者输入画面描述');
        return;
    }

    setIsGenerating(true);
    try {
      // Step 1: Optimize prompt (Optional, but recommended for SDXL)
      // We could ask Qwen to "Translate this to a detailed English art prompt for Stable Diffusion"
      // Let's skip for speed for now, or just append style keywords
      finalPrompt = `${finalPrompt}, cinematic lighting, 8k resolution, dreamy, artistic style, masterpiece`;

      const url = await aiService.generateImage(finalPrompt);
      setGeneratedUrl(url);
      onImageGenerated(url); // Auto-set
      toast.success('Dream captured! ✨');
    } catch (err) {
      console.error(err);
      toast.error('Failed to paint dream. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-2 rounded-lg transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          {t('dream.open', 'AI Dream Painter')}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Dream Painter
            </h4>
            <button 
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
                Close
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={description ? "Using diary content..." : "Describe the scene (e.g. A cat sleeping on a cloud)"}
              className="w-full text-sm p-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20"
            />
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                * AI works best with English. Keywords are auto-appended.
            </p>
          </div>

          {generatedUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-white dark:border-gray-700 shadow-md group">
                <img src={generatedUrl} alt="AI Generated" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check className="w-8 h-8 text-white" />
                </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Painting...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Art
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}

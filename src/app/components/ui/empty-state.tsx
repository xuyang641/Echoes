import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  type?: 'timeline' | 'calendar' | 'map' | 'insights' | 'search';
  message?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyIllustrations = {
  Timeline: () => (
    <svg viewBox="0 0 240 240" className="w-full h-full text-current opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="100" className="fill-blue-50 dark:fill-blue-900/20" />
      <rect x="70" y="80" width="100" height="80" rx="12" className="fill-white dark:fill-gray-800 stroke-blue-500 dark:stroke-blue-400" strokeWidth="4" />
      <circle cx="120" cy="120" r="24" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="4" />
      <path d="M150 95H160" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="4" strokeLinecap="round" />
      <path d="M85 65L95 80H145L155 65H85Z" className="fill-white dark:fill-gray-800 stroke-blue-500 dark:stroke-blue-400" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="190" cy="50" r="8" className="fill-yellow-400 animate-pulse" />
      <path d="M40 160L60 180" className="stroke-blue-300 dark:stroke-blue-600" strokeWidth="4" strokeLinecap="round" />
      <path d="M200 160L180 180" className="stroke-blue-300 dark:stroke-blue-600" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 240 240" className="w-full h-full text-current opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="100" className="fill-purple-50 dark:fill-purple-900/20" />
      <rect x="60" y="70" width="120" height="100" rx="12" className="fill-white dark:fill-gray-800 stroke-purple-500 dark:stroke-purple-400" strokeWidth="4" />
      <path d="M60 100H180" className="stroke-purple-500 dark:stroke-purple-400" strokeWidth="2" />
      <path d="M80 55V75" className="stroke-purple-500 dark:stroke-purple-400" strokeWidth="4" strokeLinecap="round" />
      <path d="M160 55V75" className="stroke-purple-500 dark:stroke-purple-400" strokeWidth="4" strokeLinecap="round" />
      <circle cx="90" cy="130" r="6" className="fill-purple-300 dark:fill-purple-600" />
      <circle cx="120" cy="130" r="6" className="fill-purple-300 dark:fill-purple-600" />
      <circle cx="150" cy="130" r="6" className="fill-purple-300 dark:fill-purple-600" />
      <circle cx="90" cy="150" r="6" className="fill-purple-300 dark:fill-purple-600" />
      <circle cx="120" cy="150" r="6" className="fill-purple-500 dark:fill-purple-400" />
    </svg>
  ),
  Map: () => (
    <svg viewBox="0 0 240 240" className="w-full h-full text-current opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="100" className="fill-green-50 dark:fill-green-900/20" />
      <path d="M70 160L90 80L150 60L170 140L110 160L70 160Z" className="fill-white dark:fill-gray-800 stroke-green-500 dark:stroke-green-400" strokeWidth="4" strokeLinejoin="round" />
      <path d="M90 80L110 160" className="stroke-green-200 dark:stroke-green-700" strokeWidth="2" />
      <path d="M150 60L110 160" className="stroke-green-200 dark:stroke-green-700" strokeWidth="2" />
      <path d="M120 110C120 110 140 100 140 85C140 76.7157 133.284 70 125 70C116.716 70 110 76.7157 110 85C110 100 130 110 130 110" className="fill-red-400 stroke-white dark:stroke-gray-900" strokeWidth="2" />
      <circle cx="125" cy="85" r="3" className="fill-white" />
    </svg>
  ),
  Insights: () => (
    <svg viewBox="0 0 240 240" className="w-full h-full text-current opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="100" className="fill-yellow-50 dark:fill-yellow-900/20" />
      <path d="M60 150L90 120L120 140L180 80" className="stroke-yellow-500 dark:stroke-yellow-400" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="150" r="4" className="fill-yellow-500 dark:fill-yellow-400" />
      <circle cx="90" cy="120" r="4" className="fill-yellow-500 dark:fill-yellow-400" />
      <circle cx="120" cy="140" r="4" className="fill-yellow-500 dark:fill-yellow-400" />
      <circle cx="180" cy="80" r="4" className="fill-yellow-500 dark:fill-yellow-400" />
      <path d="M180 80V110" className="stroke-yellow-300 dark:stroke-yellow-600" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M60 150V170" className="stroke-yellow-300 dark:stroke-yellow-600" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 240 240" className="w-full h-full text-current opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="100" className="fill-gray-50 dark:fill-gray-800" />
      <circle cx="110" cy="110" r="40" className="fill-white dark:fill-gray-900 stroke-gray-400 dark:stroke-gray-500" strokeWidth="6" />
      <path d="M140 140L170 170" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="8" strokeLinecap="round" />
      <circle cx="125" cy="95" r="4" className="fill-gray-300 dark:fill-gray-600" />
      <path d="M90 170Q120 180 150 170" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
};

export function EmptyState({ type = 'timeline', message, description: customDescription, actionLabel, onAction }: EmptyStateProps) {
  const { t } = useTranslation();

  const config = {
    timeline: {
      Illustration: EmptyIllustrations.Timeline,
      title: t('timeline.empty'),
      description: t('timeline.start'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10'
    },
    calendar: {
      Illustration: EmptyIllustrations.Calendar,
      title: '暂无记录',
      description: '这一天还没有写日记哦',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/10'
    },
    map: {
      Illustration: EmptyIllustrations.Map,
      title: '足迹为空',
      description: '去新的地方探索一下吧',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/10'
    },
    insights: {
      Illustration: EmptyIllustrations.Insights,
      title: '数据不足',
      description: '多记录一些，让我更了解你',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/10'
    },
    search: {
      Illustration: EmptyIllustrations.Search,
      title: '未找到结果',
      description: '换个关键词试试看？',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-800/50'
    }
  };

  const { Illustration, title, description, bgColor } = config[type];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className={`w-48 h-48 rounded-full ${bgColor} flex items-center justify-center mb-8 relative overflow-hidden`}>
        <div className="w-full h-full transform hover:scale-105 transition-transform duration-700">
           <Illustration />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 font-serif tracking-wide">
        {message || title}
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8 leading-relaxed text-sm">
        {customDescription || description}
      </p>

      {onAction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          {actionLabel || t('nav.add')}
        </motion.button>
      )}
    </motion.div>
  );
}

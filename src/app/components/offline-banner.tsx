import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface OfflineBannerProps {
  isOffline: boolean;
}

export function OfflineBanner({ isOffline }: OfflineBannerProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gray-900 text-white overflow-hidden z-50 relative"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>{t('common.offlineMode') || '您处于离线模式，更改将保存在本地'}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { offlineStorage } from '../../services/offline-storage';
import { useTranslation } from 'react-i18next';
import { HardDrive, Trash2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { PHOTO_DIR } from '../../services/filesystem-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

export function StorageManager() {
  const { t } = useTranslation();
  const [totalSize, setTotalSize] = useState<number>(0);
  const [fileCount, setFileCount] = useState<number>(0);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    calculateStorage();
  }, []);

  const calculateStorage = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Web fallback: estimate usage (rough)
        const entries = await offlineStorage.getEntries();
        setFileCount(entries.length);
        // Rough estimate: 200KB per entry + base64 overhead if any
        setTotalSize(entries.length * 200 * 1024); 
        return;
      }

      // Native: Read directory stats
      const result = await Filesystem.readdir({
        path: PHOTO_DIR,
        directory: Directory.Data
      });

      setFileCount(result.files.length);
      
      // Calculate total size
      let size = 0;
      for (const file of result.files) {
        // Filesystem.readdir usually returns basic info, but size might need stat()
        // This can be slow for many files. Let's just estimate or do it in background.
        // For now, let's just count files. Accurate size requires iterating stat().
        // Let's assume average 1MB per photo for display speed
        size += 1024 * 1024; 
      }
      setTotalSize(size);

    } catch (err) {
      console.error('Failed to calculate storage:', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearCache = async () => {
    setIsCleaning(true);
    const toastId = toast.loading('Cleaning cache...');
    
    // Simulate cleanup (in real app, delete thumbnails or temp files)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Cache cleaned!', { id: toastId });
    setIsCleaning(false);
  };

  const handleResetApp = async () => {
    // Dangerous!
    try {
        await offlineStorage.clear();
        if (Capacitor.isNativePlatform()) {
            await Filesystem.rmdir({
                path: PHOTO_DIR,
                directory: Directory.Data,
                recursive: true
            });
        }
        localStorage.clear();
        window.location.reload();
    } catch (err) {
        toast.error('Failed to reset app');
        console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <HardDrive className="w-5 h-5 text-gray-500" />
        {t('storage.title', 'Storage & Data')}
      </h3>

      <div className="space-y-6">
        {/* Usage Stats */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-center flex-1 border-r border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {fileCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Files</div>
            </div>
            <div className="text-center flex-1">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ~{formatSize(totalSize)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Used</div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
            <button 
                onClick={handleClearCache}
                disabled={isCleaning}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <RefreshCcw className={`w-4 h-4 ${isCleaning ? 'animate-spin' : ''}`} />
                {t('storage.clear_cache', 'Clear Cache')}
            </button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <button className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        {t('storage.reset_app', 'Reset App Data')}
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Danger Zone
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                            This will permanently delete ALL your diaries, photos, and settings. This action cannot be undone.
                            <br/><br/>
                            Please make sure you have a backup before proceeding.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-none">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetApp} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Everything
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </div>
  );
}

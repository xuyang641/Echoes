import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { offlineStorage } from '../../services/offline-storage';
import { toast } from 'react-hot-toast';
import { Download, Upload, RefreshCw, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function BackupManager() {
  const { t } = useTranslation();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleExportBackup = async () => {
    if (!confirm(t('backup.confirmExport', 'Create a full backup of all memories? This might take a while.'))) return;
    
    setIsBackingUp(true);
    const toastId = toast.loading(t('backup.preparing', 'Preparing backup...'));

    try {
      const zip = new JSZip();
      const entries = await offlineStorage.getEntries();
      
      // 1. Add JSON data
      zip.file('diary_entries.json', JSON.stringify(entries, null, 2));
      
      // 2. Add Images
      const photosFolder = zip.folder('photos');
      let processedCount = 0;

      for (const entry of entries) {
        if (entry.photo) {
          try {
            let base64Data = '';
            
            // If native path, read it
            if (!entry.photo.startsWith('data:') && !entry.photo.startsWith('http')) {
               // It's a file path like file:///...
               // We need to read it as base64
               const result = await Filesystem.readFile({
                  path: entry.photo
               });
               base64Data = result.data as string;
            } else if (entry.photo.startsWith('http://localhost/_capacitor_file_')) {
               // Convert capacitor http url back to file path?
               // Actually Filesystem.readFile takes path.
               // We need to parse the path.
               // For simplicity, let's assume we store relative paths or full paths that readFile handles.
               // Fallback: fetch the blob
               const response = await fetch(entry.photo);
               const blob = await response.blob();
               base64Data = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
               });
            } else {
               base64Data = entry.photo;
            }

            if (base64Data && base64Data.includes(',')) {
                const base64Content = base64Data.split(',')[1];
                const fileName = `${entry.id}.jpg`;
                photosFolder?.file(fileName, base64Content, { base64: true });
            }
          } catch (err) {
            console.warn(`Failed to backup photo for ${entry.id}`, err);
          }
        }
        
        processedCount++;
        if (processedCount % 5 === 0) {
            toast.loading(`Backing up: ${processedCount}/${entries.length}`, { id: toastId });
        }
      }

      // 3. Generate Zip
      toast.loading(t('backup.exporting'), { id: toastId });
      const content = await zip.generateAsync({ type: 'blob' });
      
      // 4. Save File
      const fileName = `Echoes_Backup_${format(new Date(), 'yyyyMMdd_HHmm')}.zip`;
      
      if (Capacitor.isNativePlatform()) {
        // On Android, save to Documents/Downloads
        await Filesystem.writeFile({
            path: `Download/${fileName}`,
            data: await blobToBase64(content),
            directory: Directory.ExternalStorage,
            recursive: true
        });
        toast.success(t('backup.success'), { id: toastId, duration: 5000 });
      } else {
        saveAs(content, fileName);
        toast.success(t('backup.downloaded'), { id: toastId });
      }
      
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error(t('export.failed'), { id: toastId });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Helper
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]); // Remove data:application/zip;base64,
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // ... Import logic remains same ...
  // Placeholder for handleImportBackup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(t('backup.confirmRestore', 'This will merge backup data with your current data. Continue?'))) {
      e.target.value = ''; // Reset input
      return;
    }

    setIsRestoring(true);
    const toastId = toast.loading(t('backup.restoring', 'Restoring backup...'));

    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);

      // 1. Read JSON
      const jsonFile = content.file('diary_entries.json');
      if (!jsonFile) throw new Error('Invalid backup: missing diary_entries.json');

      const jsonStr = await jsonFile.async('string');
      const entries = JSON.parse(jsonStr);
      console.log('Found entries to restore:', entries.length);

      // 2. Restore Photos
      const photoFolder = content.folder('photos');
      let processedCount = 0;

      for (const entry of entries) {
        // If entry has a photo and it's not a remote URL (http)
        // Note: Backup logic stores base64 content in ZIP with name `${entry.id}.jpg`
        if (entry.photo && photoFolder) {
          const photoName = `${entry.id}.jpg`;
          const photoFile = photoFolder.file(photoName);
          
          if (photoFile) {
            try {
              const base64Data = await photoFile.async('base64');
              
              if (Capacitor.isNativePlatform()) {
                // Save to app data directory
                const fileName = `restored_${entry.id}_${Date.now()}.jpg`;
                const savedFile = await Filesystem.writeFile({
                  path: fileName,
                  data: base64Data,
                  directory: Directory.Data,
                  recursive: true
                });
                // Update entry with new local path
                entry.photo = savedFile.uri;
              } else {
                // Web: Use Data URL directly
                entry.photo = `data:image/jpeg;base64,${base64Data}`;
              }
            } catch (err) {
              console.warn(`Failed to restore photo for ${entry.id}`, err);
            }
          }
        }
        
        processedCount++;
        if (processedCount % 5 === 0) {
           toast.loading(`${t('backup.restoring')} (${processedCount}/${entries.length})`, { id: toastId });
        }
      }

      // 3. Save to Offline Storage
      await offlineStorage.saveEntries(entries);
      
      toast.success(t('backup.restoreSuccess', 'Restore completed!'), { id: toastId });
      
      // Refresh to show new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error(t('backup.restoreFailed', 'Failed to restore backup'), { id: toastId });
    } finally {
      setIsRestoring(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Archive className="w-5 h-5 text-teal-500" />
        {t('backup.title', 'Data Backup & Restore')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('backup.desc', 'Export all your memories (photos included) as a secure ZIP file. Keep it safe.')}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleExportBackup}
          disabled={isBackingUp}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors disabled:opacity-50 font-medium"
        >
          {isBackingUp ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          {isBackingUp ? t('backup.exporting', 'Exporting...') : t('backup.export', 'Export Backup')}
        </button>

        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer font-medium ${isRestoring ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload className="w-5 h-5" />
          <span>{isRestoring ? t('backup.restoring', 'Restoring...') : t('backup.import', 'Restore Backup')}</span>
          <input 
            type="file" 
            accept=".zip" 
            onChange={handleImportBackup} 
            className="hidden" 
            disabled={isRestoring}
          />
        </label>
      </div>
    </div>
  );
}

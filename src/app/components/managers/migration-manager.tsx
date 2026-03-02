import { useState, useEffect } from 'react';
import { offlineStorage } from '../../services/offline-storage';
import { savePicture } from '../../services/filesystem-service';
import { toast } from 'react-hot-toast';

interface MigrationManagerProps {
  children: React.ReactNode;
}

export function MigrationManager({ children }: MigrationManagerProps) {
  const [isMigrating, setIsMigrating] = useState(true);

  useEffect(() => {
    checkAndMigrate();
  }, []);

  const checkAndMigrate = async () => {
    try {
      // Check flag
      const hasMigrated = localStorage.getItem('migration_v2_filesystem');
      if (hasMigrated) {
        setIsMigrating(false);
        return;
      }

      console.log('Starting Migration v2: Filesystem...');
      const entries = await offlineStorage.getEntries();
      
      let migratedCount = 0;
      const totalCount = entries.length;

      // Migrate entries with base64 photos to filesystem
      for (const entry of entries) {
        if (entry.photo && entry.photo.startsWith('data:')) {
          try {
            const fileName = `${entry.id}.jpg`;
            // Save to FS
            const newPath = await savePicture(entry.photo, fileName);
            
            // Update entry in DB
            if (newPath !== entry.photo) {
              await offlineStorage.saveEntry({
                ...entry,
                photo: newPath
              });
              migratedCount++;
            }
          } catch (err) {
            console.error(`Failed to migrate entry ${entry.id}:`, err);
          }
        }
      }

      if (migratedCount > 0) {
        toast.success(`Optimized ${migratedCount} memories for better performance!`);
      }

      // Mark as done
      localStorage.setItem('migration_v2_filesystem', 'true');
      console.log(`Migration complete. Updated ${migratedCount}/${totalCount} entries.`);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  if (isMigrating) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upgrading your database...</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          We are optimizing your memories for the new version. <br/>
          Please do not close the app.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

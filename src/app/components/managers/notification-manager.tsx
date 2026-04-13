import { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { isPermissionGranted, requestPermission as requestTauriNotificationPermission, sendNotification } from '@tauri-apps/plugin-notification';

// Constants
const REMINDER_CHANNEL_ID = 'daily_reminder';
const REMINDER_NOTIFICATION_ID = 1001;

interface NotificationSettings {
  enabled: boolean;
  time: string; // "HH:mm" format
  customText?: string;
  autostartEnabled?: boolean;
}

// Helper to save settings
const saveSettings = (settings: NotificationSettings) => {
  localStorage.setItem('notification_settings', JSON.stringify(settings));
};

// Helper to load settings
const loadSettings = (): NotificationSettings => {
  const stored = localStorage.getItem('notification_settings');
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      enabled: parsed.enabled || false,
      time: parsed.time || '21:00',
      customText: parsed.customText || '',
      autostartEnabled: parsed.autostartEnabled ?? true
    };
  }
  return { enabled: false, time: '21:00', customText: '', autostartEnabled: true }; // Default 9 PM
};

interface NotificationManagerProps {
  children: (props: {
    settings: NotificationSettings;
    updateSettings: (newSettings: NotificationSettings) => Promise<void>;
    requestPermission: () => Promise<boolean>;
  }) => React.ReactElement;
}

export function NotificationManager({ children }: NotificationManagerProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings());

  // Initialize channels on mount
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.createChannel({
        id: REMINDER_CHANNEL_ID,
        name: 'Daily Reminders',
        description: 'Reminds you to write your diary',
        importance: 4, // High importance
        visibility: 1,
        sound: 'rain.mp3', // Use our custom sound!
        vibration: true,
      }).catch(err => console.error('Failed to create notification channel:', err));
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      try {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestTauriNotificationPermission();
          // Accept 'granted', 'prompt', 'default', or boolean true
          permissionGranted = ['granted', 'prompt', 'default'].includes(permission as string) || permission === true as any;
        }
        return permissionGranted;
      } catch (err) {
        console.log('Not in Tauri or Tauri notification failed, falling back to Web Notification API', err);
        // Fallback to web notification
        if (!('Notification' in window)) return true; // Assume true for desktop environments that lack Web Notification API but might still support Tauri
        if (Notification.permission === 'granted') return true;
        if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          return permission === 'granted' || permission === 'default';
        }
        return false;
      }
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return false;
    }
  };

  const scheduleNotification = async (timeStr: string, customText?: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);

    const title = t('notifications.reminderTitle', '每日回顾');
    const body = customText?.trim() || t('notifications.reminderBody', '今天过得怎么样？在记忆褪色前记录下这一刻吧。');

    // If time has passed today, schedule for tomorrow
    if (scheduleTime <= now) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }

    if (!Capacitor.isNativePlatform()) {
      // In a real web/desktop environment, we would need a Service Worker 
      // or a background interval. For now, we'll set a timeout if it's within the next 24h
      // Note: This only works while the app is open
      const timeToWait = scheduleTime.getTime() - now.getTime();
      
      // Clear existing timeout if we stored it (not implemented fully here, just a mock for UI)
      console.log(`[Web/Desktop] Notification scheduled in ${Math.round(timeToWait / 1000 / 60)} minutes.`);
      
      // Simple mock for demonstration
      if (window.reminderTimeout) {
        clearTimeout(window.reminderTimeout);
      }
      
      window.reminderTimeout = setTimeout(async () => {
        try {
          const granted = await isPermissionGranted();
          if (granted) {
            sendNotification({
              title,
              body
            });
          }
        } catch (err) {
          if (Notification.permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/icon.png' // Ensure this exists
            });
          }
        }
      }, timeToWait) as any;
      
      return;
    }

    try {
      // Clear existing
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] });

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: REMINDER_NOTIFICATION_ID,
            schedule: {
              at: scheduleTime,
              repeats: true, // Daily repeat
              every: 'day'
            },
            sound: 'rain.mp3', // Custom sound
            channelId: REMINDER_CHANNEL_ID,
            smallIcon: 'ic_stat_icon_config_sample', // Android resource name if custom, else default
            actionTypeId: '',
            extra: null
          }
        ]
      });
      
      console.log(`Notification scheduled for ${scheduleTime.toLocaleTimeString()}`);
    } catch (err) {
      console.error('Failed to schedule notification:', err);
      toast.error('Failed to schedule reminder');
    }
  };

  const cancelNotification = async () => {
    if (!Capacitor.isNativePlatform()) {
      if (window.reminderTimeout) {
        clearTimeout(window.reminderTimeout);
        window.reminderTimeout = undefined;
      }
      return;
    }
    
    try {
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] });
    } catch (err) {
      console.error('Failed to cancel notification:', err);
    }
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    if (newSettings.enabled) {
      const granted = await requestPermission();
      if (granted) {
        await scheduleNotification(newSettings.time, newSettings.customText);
        toast.success(t('notifications.scheduled', 'Reminder set for {{time}}', { time: newSettings.time }));
        
        // Handle Windows startup if using Tauri
        if (!Capacitor.isNativePlatform()) {
            try {
                const autostartEnabled = await isEnabled();
                if (newSettings.autostartEnabled && !autostartEnabled) {
                    await enable();
                    toast.success('已开启开机自启，确保在后台推送通知');
                } else if (!newSettings.autostartEnabled && autostartEnabled) {
                    await disable();
                    toast.success('已关闭开机自启');
                }
            } catch (err) {
                console.log('Not in Tauri or failed to handle autostart:', err);
            }
        }
      } else {
        toast.error(t('notifications.permissionDenied', 'Notification permission denied'));
        // Revert setting if permission denied
        const reverted = { ...newSettings, enabled: false };
        setSettings(reverted);
        saveSettings(reverted);
      }
    } else {
      await cancelNotification();
      toast.success(t('notifications.cancelled', 'Reminder turned off'));
    }
  };

  return children({
    settings,
    updateSettings,
    requestPermission
  });
}

import { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

// Constants
const REMINDER_CHANNEL_ID = 'daily_reminder';
const REMINDER_NOTIFICATION_ID = 1001;

interface NotificationSettings {
  enabled: boolean;
  time: string; // "HH:mm" format
}

// Helper to save settings
const saveSettings = (settings: NotificationSettings) => {
  localStorage.setItem('notification_settings', JSON.stringify(settings));
};

// Helper to load settings
const loadSettings = (): NotificationSettings => {
  const stored = localStorage.getItem('notification_settings');
  if (stored) {
    return JSON.parse(stored);
  }
  return { enabled: false, time: '21:00' }; // Default 9 PM
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
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return false;
    }
  };

  const scheduleNotification = async (timeStr: string) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Clear existing
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] });

      const [hours, minutes] = timeStr.split(':').map(Number);
      const now = new Date();
      const scheduleTime = new Date();
      scheduleTime.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (scheduleTime <= now) {
        scheduleTime.setDate(scheduleTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: t('notifications.reminderTitle', 'Time to reflect'),
            body: t('notifications.reminderBody', 'How was your day? Capture a moment before it fades.'),
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
    if (!Capacitor.isNativePlatform()) return;
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
        await scheduleNotification(newSettings.time);
        toast.success(t('notifications.scheduled', 'Reminder set for {{time}}', { time: newSettings.time }));
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

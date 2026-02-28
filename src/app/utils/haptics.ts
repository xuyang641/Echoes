import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const haptics = {
  // Light impact (e.g. typing, slider change)
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore if not supported
    }
  },
  
  // Medium impact (e.g. button click, tab switch)
  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Ignore
    }
  },

  // Heavy impact (e.g. delete, critical action)
  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      // Ignore
    }
  },

  // Success notification
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      // Ignore
    }
  },

  // Error notification
  error: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      // Ignore
    }
  },

  // Warning notification
  warning: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      // Ignore
    }
  },
  
  // Selection changed (picker wheel)
  selection: async () => {
    try {
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
    } catch (e) {
        // Ignore
    }
  }
};

import { useState, useEffect } from 'react';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { useTranslation } from 'react-i18next';
import { Shield, Fingerprint, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export function SecurityManager() {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  useEffect(() => {
    // Load saved settings
    const stored = localStorage.getItem('security_biometric_enabled');
    if (stored) setIsEnabled(JSON.parse(stored));

    const privacyStored = localStorage.getItem('security_privacy_screen');
    if (privacyStored) setIsPrivacyMode(JSON.parse(privacyStored));
    
    // Apply initial state
    if (privacyStored && JSON.parse(privacyStored) && Capacitor.isNativePlatform()) {
       PrivacyScreen.enable();
    }
  }, []);

  const toggleBiometric = async (enabled: boolean) => {
    if (Capacitor.isNativePlatform()) {
        try {
            const result = await NativeBiometric.isAvailable();
            if (!result.isAvailable) {
                toast.error(t('security.authAvailable'));
                return;
            }

            if (enabled) {
                // Verify identity before enabling
                await NativeBiometric.verifyIdentity({
                    reason: t('security.verifyReason'),
                    title: t('security.verifyTitle'),
                    subtitle: t('security.verifySubtitle'),
                    description: t('security.verifyDesc')
                });
            }
        } catch (error) {
            console.error('Biometric error:', error);
            toast.error(t('security.authFailed'));
            return;
        }
    }

    setIsEnabled(enabled);
    localStorage.setItem('security_biometric_enabled', JSON.stringify(enabled));
    
    if (enabled) {
        toast.success(t('security.biometric_enabled', 'Biometric lock enabled'));
    } else {
        toast.success(t('security.biometric_disabled', 'Biometric lock disabled'));
    }
  };

  const togglePrivacyScreen = async (enabled: boolean) => {
    setIsPrivacyMode(enabled);
    localStorage.setItem('security_privacy_screen', JSON.stringify(enabled));

    if (Capacitor.isNativePlatform()) {
        try {
            if (enabled) {
                await PrivacyScreen.enable();
                toast.success(t('security.privacyEnabled'));
            } else {
                await PrivacyScreen.disable();
                toast.success(t('security.privacyDisabled'));
            }
        } catch (err) {
            console.error('Privacy Screen error:', err);
            // toast.error('Feature not available on this device');
        }
    } else {
        // toast('Privacy Screen is a mobile-only feature.', { icon: '📱' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-[var(--primary)]" />
        {t('security.title', 'Privacy & Security')}
      </h3>
      
      <div className="space-y-6">
        {/* Biometric Lock */}
        <div className="flex items-center justify-between">
            <div className="flex gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-[var(--primary)] dark:text-indigo-400">
                    <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('security.biometric', 'Biometric Lock')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('security.biometric_desc', 'Require FaceID/Fingerprint to open app')}
                    </div>
                </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isEnabled}
                    onChange={(e) => toggleBiometric(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--primary)]"></div>
            </label>
        </div>

        {/* Privacy Screen */}
        <div className="flex items-center justify-between">
            <div className="flex gap-3">
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-400">
                    <EyeOff className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('security.privacy_screen', 'Privacy Screen')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('security.privacy_desc', 'Hide content in recent apps list')}
                    </div>
                </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isPrivacyMode}
                    onChange={(e) => togglePrivacyScreen(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gray-600"></div>
            </label>
        </div>
      </div>
    </div>
  );
}

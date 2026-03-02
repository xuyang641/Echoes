import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.echoes.app',
  appName: 'Echoes',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

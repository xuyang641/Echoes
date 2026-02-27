import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.echoes.app',
  appName: 'Echoes',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.104:5174', // Updated Local Dev Server
    cleartext: true
  }
};

export default config;

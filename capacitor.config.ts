import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.storepoint.app',
  appName: 'StorePoint',
  webDir: 'dist/storePointWeb/browser',
  server: {
    androidScheme: 'https',
  },
};

export default config;

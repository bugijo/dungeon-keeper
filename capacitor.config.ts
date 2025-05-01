
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c7d2851db45f4218bdf69f51ca732bb1',
  appName: 'keeper-of-realms-forge',
  webDir: 'dist',
  server: {
    url: 'https://c7d2851d-b45f-4218-bdf6-9f51ca732bb1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      minSdkVersion: 29 // Android 10+
    }
  },
  ios: {
    limitsNavigationsToAppBoundDomains: true,
    minimumVersion: '14.0' // iOS 14+
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.doti.app',
  appName: 'Doti',
  webDir: 'dist',
  backgroundColor: '#121827',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#121827',
      showSpinner: false,
    },
  },
}

export default config

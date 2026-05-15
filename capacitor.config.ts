import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'de.do2ef.dmrdashboard',
  appName: 'DMR Dashboard',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config

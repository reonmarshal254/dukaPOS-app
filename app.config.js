/**
 * app.config.js
 *
 * APP_VARIANT env var controls which build profile is active:
 *   - (unset / 'development') → dev build, unique package name, no ProGuard
 *   - 'production'            → release build, com.dukapos.app, ProGuard on
 *
 * ADMIN_API_URL is injected by eas.json at build time.
 * At dev time it falls back to the Android emulator host.
 */

const IS_PRODUCTION = process.env.APP_VARIANT === 'production';

// Admin backend URL — set by eas.json env, or LAN IP for local dev
const ADMIN_API_URL =
  process.env.ADMIN_API_URL ||
  (IS_PRODUCTION
    ? 'https://dukapos-gjfx.onrender.com'
    : 'http://10.0.2.2:5000');

export default {
  expo: {
    name: IS_PRODUCTION ? 'DukaPOS' : 'DukaPOS (Dev)',
    slug: 'dukapos',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'dukapos',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#2563EB',
    },
    assetBundlePatterns: ['**/*'],

    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_PRODUCTION
        ? 'com.dukapos.app'
        : 'com.dukapos.app.dev',
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2563EB',
      },
      package: IS_PRODUCTION ? 'com.dukapos.app' : 'com.dukapos.app.dev',
      versionCode: 1,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.INTERNET',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
      ],
      ...(IS_PRODUCTION && {
        enableProguardInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true,
      }),
    },

    web: {
      favicon: './assets/favicon.png',
    },

    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-sqlite',
      [
        'expo-image-picker',
        {
          photosPermission:
            'DukaPOS accesses your photos to let you add product images.',
          cameraPermission:
            'DukaPOS accesses your camera to let you take product photos.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#2563EB',
          sounds: [],
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          organization: 'mcokoth-technologies',
          project: 'duka',
          url: 'https://sentry.io/',
          // Disable source map upload (requires auth token)
          // Crash reporting still works, but stack traces won't show original source locations
          setCommits: false,
          deployPreview: false,
        },
      ],

      '@react-native-community/datetimepicker',
      'expo-sharing',
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      // Readable at runtime via Constants.expoConfig.extra
      adminApiUrl: ADMIN_API_URL,
      sentryDsn: process.env.SENTRY_DSN || '',
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      isProduction: IS_PRODUCTION,
      appVersion: '1.0.0',
      // Subscription plan prices (KES in minor units — cents)
      planPrices: {
        daily:    parseInt(process.env.PLAN_DAILY_PRICE    || '10000',  10),
        weekly:   parseInt(process.env.PLAN_WEEKLY_PRICE   || '60000',  10),
        monthly:  parseInt(process.env.PLAN_MONTHLY_PRICE  || '200000', 10),
        lifetime: parseInt(process.env.PLAN_LIFETIME_PRICE || '1000000',10),
      },
      // EAS project ID
      eas: {
        projectId: 'afc8dce1-639a-4998-8a9c-13413df21fb7',
      },
    },

    // OTA updates
    updates: {
      url: 'https://u.expo.dev/afc8dce1-639a-4998-8a9c-13413df21fb7',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
  },
};

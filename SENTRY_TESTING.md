# Sentry Crash Reporting - Testing Guide

## Current Setup

✅ **Sentry initialized** in `src/app/_layout.tsx`  
✅ **DSN configured**: `https://e8636f00010902861d65dfb574cdfa78@...`  
✅ **Organization**: mcokoth-technologies  
✅ **Project**: duka  
✅ **Test button added** in Settings → Data (Dev only)

## Why Crashes Might Not Be Sent

### 1. Development Mode Behavior
- Expo dev builds run in a different context
- Crashes in dev are often caught by the Metro bundler
- For reliable testing, use a **standalone build** (APK/IPA)

### 2. Network Issues
- Device must have internet connection
- Sentry events are sent asynchronously
- May take 30-60 seconds to appear in dashboard

### 3. Debug Mode
- `__DEV__` flag affects how errors are handled
- React Native's RedBox catches errors first in dev
- Production builds behave differently

## How to Test Sentry (3 Methods)

### Method 1: Test Button in Settings (Easiest)

1. **Open the app** in development mode
2. **Go to**: Settings → Data section
3. **Tap**: "🧪 Test Crash Reporting" (only visible in dev)
4. **Confirm** the test
5. **Wait** 30-60 seconds
6. **Check** Sentry dashboard: https://mcokoth-technologies.sentry.io/issues/?project=4512248017911808

**Expected Result**:
- Console log: `[Sentry] 📤 Sending event to Sentry: Test Sentry Error`
- Alert shows: "✅ Test Sent"
- Error appears in Sentry dashboard within 1 minute

### Method 2: Trigger Real Crash in Dev

Add this temporary code anywhere (e.g., in a button):

```typescript
import { captureException } from '../../../services/sentryService';

// Somewhere in your component
const triggerCrash = () => {
  try {
    throw new Error('Test crash from DukaPOS');
  } catch (error) {
    captureException(error as Error, { 
      testType: 'manual',
      screen: 'SettingsScreen' 
    });
  }
};
```

### Method 3: Production Build Testing (Most Reliable)

```bash
cd mobile

# Build production APK with EAS
npx eas-cli build --platform android --profile production

# Or build locally
npx expo prebuild --clean
npx expo run:android --variant release
```

Then:
1. Install the production APK
2. Trigger a crash (test button or real error)
3. **Close and reopen** the app (sends queued events)
4. Check Sentry dashboard

## Verify Sentry Configuration

### Check Console Logs

When app starts, you should see:
```
[Sentry] Initialized successfully
```

When test error is sent:
```
[Sentry] 📤 Sending event to Sentry: Test Sentry Error - This is intentional
```

### Check Sentry Dashboard

1. Go to: https://mcokoth-technologies.sentry.io
2. Click on **"duka"** project
3. Go to **Issues** tab
4. Look for your test errors

### Verify DSN

Check `.env` file:
```env
SENTRY_DSN=https://e8636f00010902861d65dfb574cdfa78@o4512247884480512.ingest.us.sentry.io/4512248017911808
```

Or check at runtime:
```typescript
import Constants from 'expo-constants';
console.log('Sentry DSN:', Constants.expoConfig?.extra?.sentryDsn);
```

## Common Issues & Solutions

### Issue 1: "DSN not configured" Warning

**Symptoms**: Console shows `[Sentry] DSN not configured`

**Solutions**:
- Verify `.env` has `SENTRY_DSN=...`
- Restart Metro bundler: `npx expo start --clear`
- Check `app.config.js` passes DSN to `extra.sentryDsn`

### Issue 2: Events Not Appearing in Dashboard

**Symptoms**: Test sent but nothing in Sentry

**Solutions**:
1. **Wait longer**: Events can take up to 5 minutes
2. **Check filters**: Remove all filters in Sentry Issues tab
3. **Check environment**: Look for "development" environment
4. **Check quota**: Verify Sentry plan isn't at limit
5. **Try production build**: Dev builds behave differently

### Issue 3: "Sentry Initialization Failed"

**Symptoms**: Console error on app start

**Solutions**:
- Check internet connection
- Verify DSN is valid (no typos)
- Check if Sentry service is down (status.sentry.io)
- Review `sentryService.ts` for syntax errors

### Issue 4: No Console Logs

**Symptoms**: No Sentry logs at all

**Solutions**:
- Check if `__DEV__` is true: `console.log(__DEV__)`
- Verify import: `import { initializeSentry } from '../services/sentryService'`
- Check if called: Verify `initializeSentry()` runs in `_layout.tsx`

## Expected Behavior by Environment

### Development (Metro Bundler)
- ✅ Sentry initialized
- ✅ Console logs show events
- ⚠️ Events **do send** to Sentry (changed from before)
- ✅ RedBox shows errors first
- ✅ Test button works

### Production (Standalone APK)
- ✅ Sentry initialized
- ❌ No console logs (no Metro)
- ✅ Events sent reliably
- ✅ Native crashes captured
- ❌ No test button (dev only)

## What Sentry Captures

### Automatically Captured
- ✅ Unhandled JavaScript errors
- ✅ Unhandled promise rejections
- ✅ Native crashes (Android/iOS)
- ✅ React component errors (via ErrorBoundary)
- ✅ Navigation breadcrumbs

### Manually Captured
```typescript
import { 
  captureException, 
  captureMessage, 
  addBreadcrumb 
} from '../services/sentryService';

// Capture exception with context
captureException(error, { userId: '123', action: 'purchase' });

// Capture message
captureMessage('Payment successful', 'info');

// Add breadcrumb for debugging
addBreadcrumb('User tapped checkout', 'ui', 'info', { cart: cartData });
```

## Sentry Dashboard Features

### Issues Tab
- See all errors grouped by type
- Click to see stack traces
- View frequency and user impact

### Performance Tab (if enabled)
- See slow transactions
- Identify performance bottlenecks

### Releases
- Track errors by app version
- See if issues were fixed

## Testing Checklist

Before deploying to production:

- [ ] Test button sends event successfully
- [ ] Event appears in Sentry dashboard within 1 minute
- [ ] Device context is populated (OS, model, etc.)
- [ ] App context is populated (version, build)
- [ ] Stack traces are readable
- [ ] Production APK sends events
- [ ] Events persist after app restart
- [ ] Native crashes are captured

## Current Configuration

```typescript
// src/services/sentryService.ts
Sentry.init({
  dsn: 'https://e8636f00010902861d65dfb574cdfa78@...',
  debug: __DEV__,  // Shows logs in dev
  environment: __DEV__ ? 'development' : 'production',
  enableAutoSessionTracking: true,
  enableNative: true,
  enableAutoPerformanceTracing: true,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,  // 100% dev, 20% prod
})
```

## Next Steps

1. **Test now**: Go to Settings → Data → Test Crash Reporting
2. **Wait**: Check Sentry dashboard after 1 minute
3. **Verify**: Event should appear in Issues tab
4. **Build**: Create production APK for real-world testing
5. **Monitor**: Keep Sentry dashboard open during testing

## Useful Links

- **Sentry Dashboard**: https://mcokoth-technologies.sentry.io
- **Project**: https://mcokoth-technologies.sentry.io/issues/?project=4512248017911808
- **Status Page**: https://status.sentry.io
- **Docs**: https://docs.sentry.io/platforms/react-native/

## Support

If events still don't appear after following this guide:

1. Check console for "[Sentry]" logs
2. Verify internet connection
3. Try production build
4. Check Sentry status page
5. Review Sentry quota/limits

The test button in Settings is the fastest way to verify Sentry is working! 🚀

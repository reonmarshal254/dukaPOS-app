# ✅ Sentry is Configured! Test It Now

Your Sentry DSN is configured and ready to use.

---

## 🧪 Quick Test (3 Steps)

### Step 1: Start the App
```bash
npx expo start
```

### Step 2: Add Test Code
Open any screen (e.g., `src/app/(tabs)/settings/index.tsx`) and add this temporarily:

```typescript
import { testSentry } from '../../../services/sentryService';

// Add a button in your render:
<Button 
  title="Test Sentry" 
  onPress={() => testSentry()} 
/>
```

Or just call it in `useEffect`:
```typescript
useEffect(() => {
  testSentry(); // Test on mount
}, []);
```

### Step 3: Check Sentry Dashboard
Go to: https://mcokoth-technologies.sentry.io/issues/

You should see a new issue: **"Test Sentry Error - This is intentional"**

✅ If you see it, Sentry is working perfectly!

---

## 🎯 Your Sentry Setup

**Organization:** mcokoth-technologies  
**Project:** duka  
**Dashboard:** https://mcokoth-technologies.sentry.io/

**Key URLs:**
- Issues: https://mcokoth-technologies.sentry.io/issues/
- Performance: https://mcokoth-technologies.sentry.io/performance/
- Releases: https://mcokoth-technologies.sentry.io/releases/

---

## 🚀 Build with Sentry

Now build your APK with crash reporting enabled:

```bash
eas build --profile preview --platform android
```

All crashes will be automatically reported to:
https://mcokoth-technologies.sentry.io/issues/

---

## 📊 What Gets Reported

### Automatic:
- ✅ All JavaScript crashes
- ✅ Native crashes
- ✅ Unhandled promises
- ✅ React component errors

### Context:
- Device model and OS
- App version
- User actions (breadcrumbs)
- Stack traces
- Environment info

---

## 🔔 Set Up Alerts (Optional)

1. Go to: https://mcokoth-technologies.sentry.io/settings/projects/duka/alerts/
2. Create alert:
   - Trigger: "A new issue is created"
   - Action: "Send a notification via email"
   - Save
3. Now you'll be notified of crashes immediately!

---

## 📱 Production Testing

After building and installing on device:

1. Use the app normally
2. If it crashes, check Sentry dashboard
3. You'll see:
   - Error message
   - Stack trace
   - Device info
   - What the user was doing

---

## ✅ Configuration Summary

All files updated with your DSN:
- `.env` ✓
- `.env.production` ✓
- `eas.json` (all profiles) ✓
- `app.config.js` ✓

**You're all set!** 🎉

Just build and deploy. All crashes will be automatically tracked.

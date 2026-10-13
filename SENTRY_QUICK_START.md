# 🚀 Sentry Quick Start - DukaPOS Mobile

## ✅ Installation Complete!

Sentry crash reporting has been fully integrated into your app.

---

## 🔑 STEP 1: Get Your Sentry DSN

1. **Go to Sentry:**
   - Visit: https://mcokoth-technologies.sentry.io/
   - Login with your Sentry account

2. **Create/Open Project:**
   - If project exists: Open `dukapos-mobile`
   - If not: Create new React Native project called `dukapos-mobile`

3. **Get DSN:**
   - Go to: Settings → Projects → dukapos-mobile → Client Keys (DSN)
   - Or direct link: https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/
   - Copy the DSN (looks like: `https://xxxx@xxxx.ingest.sentry.io/xxxx`)

---

## 📝 STEP 2: Add DSN to Your Project

### Easy Method (Recommended):

Run the configuration helper:
```bash
npm run sentry-config
```

This will:
1. Prompt you to paste your DSN
2. Automatically update all configuration files
3. Verify the setup

### Manual Method:

**Edit `.env` file:**
```bash
SENTRY_DSN=https://your-actual-dsn-here@xxxx.ingest.sentry.io/xxxx
```

**Edit `.env.production` file:**
```bash
SENTRY_DSN=https://your-actual-dsn-here@xxxx.ingest.sentry.io/xxxx
```

**Edit `eas.json`** - add your DSN to all build profiles:
```json
{
  "build": {
    "preview": {
      "env": {
        "SENTRY_DSN": "https://your-actual-dsn-here"
      }
    },
    "production": {
      "env": {
        "SENTRY_DSN": "https://your-actual-dsn-here"
      }
    }
  }
}
```

---

## 🧪 STEP 3: Test It

### In Development Mode:

```bash
# Start the app
npx expo start

# In any screen, add this temporarily:
import { testSentry } from '../services/sentryService';

// Then call it:
testSentry();

# Check Sentry dashboard - you should see the test error!
```

### In Production Build:

```bash
# Build APK
eas build --profile preview --platform android

# Download and install on device
eas build:download

# Open app and use it
# Any crashes will be sent to Sentry automatically
```

---

## 📊 What Gets Reported

### Automatic Crash Reports:
- ✅ All JavaScript errors
- ✅ Native crashes (Android)
- ✅ Unhandled promise rejections
- ✅ React component errors
- ✅ Network failures

### Context Included:
- Device model and OS
- App version and build
- User actions (breadcrumbs)
- Stack traces
- Environment info

---

## 🎯 What Happens When App Crashes

1. **App crashes** → Error caught by ErrorBoundary or Global Handler
2. **Sentry automatically:**
   - Captures the error
   - Collects device info
   - Saves breadcrumbs
   - Sends to Sentry dashboard
3. **You get notified** (if alerts configured)
4. **You see the error** in Sentry dashboard with full details
5. **You fix it** and push update!

---

## 🔔 Set Up Alerts (Optional but Recommended)

1. Go to: https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/alerts/
2. Create alert rule:
   - Trigger: "New issue"
   - Action: Send email/Slack notification
   - Save

Now you'll be notified immediately when crashes occur!

---

## 📱 Files Modified

### New Files:
- `src/services/sentryService.ts` - Sentry initialization and utilities

### Modified Files:
- `app.config.js` - Added Sentry plugin
- `src/app/_layout.tsx` - Initialize Sentry on app start
- `src/components/ErrorBoundary.tsx` - Report to Sentry
- `src/utils/errorHandler.ts` - Report to Sentry
- `.env` - Added SENTRY_DSN placeholder
- `.env.production` - Added SENTRY_DSN placeholder
- `eas.json` - Added SENTRY_DSN to all build profiles

---

## ✅ Verification Checklist

- [ ] Sentry package installed (`@sentry/react-native`)
- [ ] Sentry DSN obtained from dashboard
- [ ] DSN added to `.env` file
- [ ] DSN added to `eas.json`
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Test error sent in development
- [ ] Test error visible in Sentry dashboard
- [ ] Build APK with Sentry
- [ ] Test crash on device
- [ ] Crash appears in Sentry dashboard

---

## 🆘 Troubleshooting

### Can't find Sentry DSN?
- Go to: https://mcokoth-technologies.sentry.io/settings/projects/
- Create new React Native project if needed
- Copy DSN from project settings

### Errors not appearing in Sentry?
- Check DSN is correct (no typos)
- Verify internet connection on device
- Look for "[Sentry]" logs in console
- Try `testSentry()` function

### Build failing?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo prebuild --clean
```

---

## 📚 Documentation

- **Full Setup Guide:** `SENTRY_SETUP.md`
- **Sentry Dashboard:** https://mcokoth-technologies.sentry.io/
- **Sentry Docs:** https://docs.sentry.io/platforms/react-native/

---

## 🎉 You're All Set!

Sentry is now monitoring your app. All crashes will be automatically reported with full context.

**Next Step:** Add your Sentry DSN and start building! 

```bash
# After adding DSN, build your app:
eas build --profile preview --platform android
```

---

**Questions?** Check `SENTRY_SETUP.md` for detailed information.

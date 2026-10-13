# 🔍 Sentry Crash Reporting Setup Guide

## ✅ What's Been Installed

Sentry has been integrated into your DukaPOS mobile app. All crashes and errors will now be automatically reported to Sentry.

---

## 🔑 Get Your Sentry DSN

You need to get your Sentry DSN (Data Source Name) from your Sentry dashboard:

1. **Go to your Sentry project:**
   - Organization: `mcokoth-technologies`
   - Project: `dukapos-mobile` (or create it if it doesn't exist)

2. **Get the DSN:**
   - Navigate to: https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/
   - Copy the DSN (looks like: `https://xxxxxxxxxxxxx@xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxx`)

3. **Or create a new project:**
   - Go to: https://mcokoth-technologies.sentry.io/projects/new/
   - Platform: React Native
   - Project name: `dukapos-mobile`
   - Copy the DSN provided

---

## 📝 Add Sentry DSN to Your Project

### Option 1: Add to Environment Files (Development)

1. **Edit `.env` file:**
   ```bash
   # Find this line:
   SENTRY_DSN=
   
   # Replace with your actual DSN:
   SENTRY_DSN=https://xxxxxxxxxxxxx@xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxx
   ```

2. **Edit `.env.production` file:**
   ```bash
   # Find this line:
   SENTRY_DSN=
   
   # Replace with your actual DSN:
   SENTRY_DSN=https://xxxxxxxxxxxxx@xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxx
   ```

### Option 2: Add to EAS Build Configuration (Production Builds)

**Edit `eas.json`** and add your DSN to all build profiles:

```json
{
  "build": {
    "preview": {
      "env": {
        "SENTRY_DSN": "https://xxxxxxxxxxxxx@xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxx"
      }
    },
    "production": {
      "env": {
        "SENTRY_DSN": "https://xxxxxxxxxxxxx@xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxx"
      }
    }
  }
}
```

---

## 🚀 What's Integrated

### 1. **Automatic Crash Reporting**
- All JavaScript errors
- Native crashes (Android/iOS)
- Unhandled promise rejections
- React component errors

### 2. **Error Boundaries**
- `ErrorBoundary` component reports all caught errors to Sentry
- Shows user-friendly error screen
- Sends detailed crash info to Sentry

### 3. **Global Error Handler**
- Catches uncaught exceptions
- Reports fatal and non-fatal errors
- Includes device context

### 4. **User Context**
- Device model and OS version
- App version and build number
- User ID (when user logs in)

### 5. **Performance Monitoring**
- Navigation tracking
- User interaction tracing
- API call monitoring

---

## 🧪 Test Sentry Integration

### Test in Development:

```typescript
// In any component or screen, import:
import { testSentry } from '../services/sentryService';

// Then call:
testSentry();
```

This will:
1. Throw a test error
2. Capture it in Sentry
3. You should see it in your Sentry dashboard within seconds

### Check Sentry Dashboard:

1. Go to: https://mcokoth-technologies.sentry.io/
2. Open your `dukapos-mobile` project
3. You should see the test error appear in "Issues"

---

## 📊 What Gets Reported

### Automatically Captured:
- ✅ JavaScript errors
- ✅ Native crashes
- ✅ Unhandled promise rejections
- ✅ React component errors
- ✅ Network errors (via integrations)

### Context Included:
- Device information (model, OS, version)
- App information (version, build number)
- User information (if set)
- Breadcrumbs (user actions before crash)
- Stack traces
- Environment (development/production)

---

## 🔧 Advanced Usage

### Manually Capture Errors:

```typescript
import { captureException, captureMessage } from '../services/sentryService';

try {
  // Your code
} catch (error) {
  captureException(error as Error, {
    feature: 'payment',
    userId: user.id,
  });
}
```

### Add Breadcrumbs:

```typescript
import { addBreadcrumb } from '../services/sentryService';

addBreadcrumb('User clicked checkout button', 'ui', 'info', {
  amount: 1000,
  items: 5,
});
```

### Set User Information:

```typescript
import { setUser } from '../services/sentryService';

// After user logs in
setUser(deviceId, business.email, business.name);

// On logout
import { clearUser } from '../services/sentryService';
clearUser();
```

### Set Custom Tags:

```typescript
import { setTag } from '../services/sentryService';

setTag('payment_method', 'mpesa');
setTag('plan', 'monthly');
```

---

## 📱 Testing Builds

### Test in Preview Build:

```bash
cd mobile

# Build with Sentry
eas build --profile preview --platform android

# Download and install
eas build:download

# Force a crash to test
# Open app and trigger an error
```

### Check Sentry Dashboard:
- Errors should appear within seconds
- Click on an issue to see full details
- View device info, stack trace, breadcrumbs

---

## 🔒 Security Notes

### Never Commit Your DSN:
- ❌ Don't commit `.env` files with real DSN
- ✅ Use EAS Secrets for production builds
- ✅ Or use environment-specific DSNs

### Using EAS Secrets (Recommended):

```bash
# Set secret for all build profiles
eas secret:create --name SENTRY_DSN --value "your-dsn-here" --type string

# Or per-environment
eas secret:create --scope project --name SENTRY_DSN --value "your-dsn-here"
```

Then in `eas.json`:
```json
{
  "env": {
    "SENTRY_DSN": "@SENTRY_DSN"
  }
}
```

---

## 📈 Monitoring Best Practices

### 1. **Check Sentry Daily**
- Review new crashes
- Track error trends
- Fix high-priority issues

### 2. **Set Up Alerts**
- Configure email/Slack notifications
- Set up for new issues
- Alert on spike in errors

### 3. **Release Tracking**
- Sentry automatically tracks releases
- Compare error rates between versions
- Identify problematic releases

### 4. **Performance Monitoring**
- Enable transactions in Sentry
- Monitor slow screens
- Track API response times

---

## 🐛 Troubleshooting

### "DSN not configured" Warning:
- Check that `SENTRY_DSN` is set in `.env` or `eas.json`
- Restart Expo dev server after adding DSN
- Rebuild app if using EAS build

### Errors Not Appearing in Sentry:
- Verify DSN is correct
- Check internet connection on device
- Look for Sentry init logs in console
- Test with `testSentry()` function

### Too Many Events:
- Adjust `tracesSampleRate` in `sentryService.ts`
- Set up release filters in Sentry dashboard
- Use Sentry's quota management

---

## 📚 Resources

- **Sentry Dashboard:** https://mcokoth-technologies.sentry.io/
- **Sentry React Native Docs:** https://docs.sentry.io/platforms/react-native/
- **Sentry Performance:** https://docs.sentry.io/product/performance/
- **EAS Secrets:** https://docs.expo.dev/build-reference/variables/

---

## ✅ Quick Start Checklist

- [ ] Get Sentry DSN from dashboard
- [ ] Add DSN to `.env` file
- [ ] Add DSN to `eas.json`
- [ ] Test with `testSentry()` in development
- [ ] Build preview APK
- [ ] Install and test on device
- [ ] Force a crash to verify reporting
- [ ] Check Sentry dashboard for crash report
- [ ] Set up Slack/email alerts
- [ ] Configure release tracking

---

**Sentry is now fully integrated!** 🎉

All crashes will be automatically reported with full context, helping you fix issues faster and improve app stability.

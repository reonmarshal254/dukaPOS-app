# 🔍 Sentry Crash Reporting - Complete Setup

## ✅ Status: READY TO CONFIGURE

Sentry has been fully integrated into your DukaPOS mobile app. You just need to add your DSN.

---

## 🚀 Quick Setup (3 Steps)

### 1️⃣ Get Your Sentry DSN

**Option A: Create New Project**
1. Go to: https://sentry.io/organizations/mcokoth-technologies/projects/new/
2. Platform: **React Native**
3. Project Name: `dukapos-mobile`
4. Copy the DSN shown

**Option B: Use Existing Project**
1. Go to: https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/
2. Copy the DSN under "Client Keys (DSN)"

Your DSN looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

---

### 2️⃣ Configure Your App

**Easy Way (Recommended):**
```bash
cd c:\Users\oyooo\POS\mobile
npm run sentry-config
```

Then paste your DSN when prompted. Done! ✅

**Manual Way:**
Edit these files and replace the empty `SENTRY_DSN=` with your actual DSN:
- `.env`
- `.env.production`
- `eas.json` (all three build profiles)

---

### 3️⃣ Test & Build

**Test in Development:**
```bash
npx expo start

# In any screen, temporarily add:
import { testSentry } from '../services/sentryService';
testSentry();

# Check Sentry dashboard - you should see the error!
```

**Build for Production:**
```bash
eas build --profile preview --platform android
```

---

## 📊 What Gets Reported Automatically

### All Crashes & Errors:
- ✅ JavaScript errors
- ✅ Native crashes (Android/iOS)
- ✅ Unhandled promise rejections
- ✅ React component errors
- ✅ Network failures

### Rich Context:
- Device model, manufacturer, OS version
- App version and build number
- User actions before crash (breadcrumbs)
- Full stack traces
- Environment (dev/production)

---

## 🎯 Integration Points

Sentry is integrated at multiple levels:

1. **App Initialization** (`_layout.tsx`)
   - Sentry initializes before anything else
   - Sets up device and app context

2. **Error Boundary** (`ErrorBoundary.tsx`)
   - Catches React component errors
   - Reports to Sentry with component stack

3. **Global Error Handler** (`errorHandler.ts`)
   - Catches uncaught exceptions
   - Reports fatal and non-fatal errors

4. **Manual Reporting** (`sentryService.ts`)
   - Utilities for custom error tracking
   - User context management
   - Breadcrumb tracking

---

## 🔧 Advanced Usage

### Capture Custom Errors:
```typescript
import { captureException } from '../services/sentryService';

try {
  await riskyOperation();
} catch (error) {
  captureException(error as Error, {
    feature: 'payment',
    userId: deviceId,
  });
}
```

### Add Breadcrumbs:
```typescript
import { addBreadcrumb } from '../services/sentryService';

addBreadcrumb('User started checkout', 'navigation', 'info', {
  cart_total: 5000,
  items_count: 3,
});
```

### Set User Context:
```typescript
import { setUser, clearUser } from '../services/sentryService';

// After business setup
setUser(deviceId, business.email, business.name);

// On logout or reset
clearUser();
```

### Custom Tags:
```typescript
import { setTag } from '../services/sentryService';

setTag('subscription_plan', 'monthly');
setTag('payment_method', 'mpesa');
```

---

## 📱 Monitoring Your App

### Sentry Dashboard:
- **Issues:** https://mcokoth-technologies.sentry.io/issues/
- **Performance:** https://mcokoth-technologies.sentry.io/performance/
- **Releases:** https://mcokoth-technologies.sentry.io/releases/

### Key Metrics to Watch:
1. **Crash-Free Rate** - Should be >99%
2. **Error Frequency** - Trending up? Investigate!
3. **Affected Users** - How many users hit this bug?
4. **Performance** - Slow screens or API calls

### Set Up Alerts:
1. Go to: Settings → Alerts
2. Create rules for:
   - New issues
   - Spike in errors
   - Performance degradation
3. Configure notifications (Email/Slack)

---

## 🔒 Security & Privacy

### DSN Security:
- ✅ DSN is public-facing (safe to expose)
- ✅ Only allows sending events, not reading them
- ❌ Never commit `.env` files with real values
- ✅ Use EAS Secrets for sensitive builds

### User Privacy:
- Sentry captures device info, not personal data
- No PII (personally identifiable information) sent by default
- You control what context gets sent
- GDPR compliant with proper configuration

### Using EAS Secrets:
```bash
# Store DSN as a secret
eas secret:create --scope project --name SENTRY_DSN --value "your-dsn"

# Then in eas.json use:
"env": {
  "SENTRY_DSN": "@SENTRY_DSN"
}
```

---

## 🐛 Troubleshooting

### "DSN not configured" warning:
- Run `npm run sentry-config` and add your DSN
- Or manually check `.env` and `eas.json`
- Restart Expo dev server after changes

### Errors not appearing in Sentry:
- Verify DSN is correct (no typos)
- Check device has internet connection
- Look for `[Sentry]` logs in console
- Test with `testSentry()` function
- Check Sentry project quota (free tier limits)

### Build failing after Sentry:
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo prebuild --clean
```

### Too many events being sent:
- Adjust `tracesSampleRate` in `sentryService.ts`
- Set up beforeSend filtering
- Use Sentry's quota management

---

## 📚 Documentation

### Project Docs:
- **Quick Start:** `SENTRY_QUICK_START.md`
- **Full Setup:** `SENTRY_SETUP.md`
- **This File:** `SENTRY_README.md`

### Sentry Docs:
- **React Native:** https://docs.sentry.io/platforms/react-native/
- **Configuration:** https://docs.sentry.io/platforms/react-native/configuration/
- **Performance:** https://docs.sentry.io/product/performance/
- **Releases:** https://docs.sentry.io/product/releases/

### EAS Docs:
- **Environment Variables:** https://docs.expo.dev/build-reference/variables/
- **Secrets:** https://docs.expo.dev/build-reference/variables/#using-secrets

---

## ✅ Verification Checklist

- [ ] Sentry package installed (`@sentry/react-native`)
- [ ] Sentry DSN obtained from dashboard
- [ ] DSN configured in `.env`
- [ ] DSN configured in `eas.json`
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Test error sent with `testSentry()`
- [ ] Test error visible in Sentry dashboard
- [ ] Preview APK built successfully
- [ ] Crash tested on physical device
- [ ] Crash report received in Sentry
- [ ] Alerts configured (optional)
- [ ] Team invited to Sentry project (optional)

---

## 🎓 Best Practices

### 1. Release Tracking
Every build should have a unique release:
- Auto-configured: `dukapos-mobile@1.0.0`
- Distribution: build number
- View in: Sentry → Releases

### 2. Environment Tags
Already set up:
- `development` - Dev builds
- `production` - Release builds

### 3. Breadcrumbs
Add before critical operations:
```typescript
addBreadcrumb('Starting payment', 'payment', 'info');
```

### 4. Context
Set user context after setup:
```typescript
setUser(deviceId, email, businessName);
```

### 5. Error Filtering
Not all errors need reporting:
```typescript
// In sentryService.ts beforeSend:
if (event.message?.includes('Network request failed')) {
  return null; // Don't report network errors
}
```

---

## 📞 Support

### Need Help?
1. Check troubleshooting section above
2. Review Sentry docs
3. Check Sentry status: https://status.sentry.io/
4. Contact Sentry support (paid plans)

### Common Questions:

**Q: Is Sentry free?**
A: Yes, free tier includes 5,000 errors/month. Upgrade for more.

**Q: What's the performance impact?**
A: Minimal. <1% CPU, minimal battery impact.

**Q: Can I test locally?**
A: Yes! Use `testSentry()` in development mode.

**Q: How do I see crashes in real-time?**
A: Set up Slack/email alerts in Sentry settings.

**Q: Can I remove Sentry later?**
A: Yes, just remove DSN and the integration becomes inactive.

---

## 🎉 You're Ready!

Sentry is fully integrated and ready to monitor your app in production.

### Next Steps:
1. Run `npm run sentry-config` to add your DSN
2. Test with `testSentry()` 
3. Build your APK: `eas build --profile preview --platform android`
4. Deploy with confidence! 🚀

---

**All crashes will now be automatically reported with full context.**

Good luck with your app! 🎊

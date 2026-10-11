# EAS Build Setup (Optional)

EAS Build lets you build Android APKs in the cloud without needing the Android SDK locally. This is **optional** — you can build locally with `npx expo run:android` if you already have Android Studio installed.

---

## Why Use EAS Build?

✅ **No local Android SDK required** — build on EAS servers  
✅ **Consistent builds** — same environment every time  
✅ **CI/CD friendly** — easy to automate  
✅ **OTA updates** — push JavaScript updates without rebuilding  

---

## Initial Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login (creates an Expo account if needed)

```bash
eas login
```

Follow the prompts to create/login to your Expo account.

### 3. Initialize Your Project

```bash
cd c:\Users\oyooo\POS\mobile
eas init
```

This will:
- Create an EAS project on expo.dev
- Generate a unique project ID
- Update `app.config.js` automatically with the ID

### 4. Configure Builds (already done)

The `eas.json` file already has three build profiles:
- **development** — dev build with debugging enabled
- **preview** — production-like build for testing
- **production** — release build for Play Store

---

## Building

### Development Build (for testing)

```bash
eas build --profile development --platform android
```

Download the APK and install on your device.

### Preview Build (pre-release testing)

```bash
eas build --profile preview --platform android
```

### Production Build (Play Store)

```bash
eas build --profile production --platform android
```

Then submit:
```bash
eas submit --platform android --latest
```

---

## Changing Pricing

Pricing is configured in `eas.json` → baked into the build.

1. Edit `mobile/eas.json` (all three profiles):
   ```json
   {
     "build": {
       "production": {
         "env": {
           "PLAN_DAILY_PRICE": "15000",   // new price
           ...
         }
       }
     }
   }
   ```

2. Rebuild:
   ```bash
   eas build --profile production --platform android
   ```

3. Submit to Play Store

---

## Local Builds (Alternative)

If you have Android Studio installed, skip EAS and build locally:

```bash
# Development build
npx expo run:android

# Release build
npx expo run:android --variant release
```

Local builds are:
- ✅ Faster (no upload/queue time)
- ✅ Free (no EAS build minutes)
- ❌ Require Android SDK setup
- ❌ Harder to automate (need local machine)

---

## Troubleshooting

### "Invalid UUID appId"
Run `eas init` first to create the project ID.

### "Not logged in"
Run `eas login`.

### "Build failed"
Check the build logs on expo.dev — usually a missing dependency or config issue.

### Builds taking forever
EAS free tier has limited workers. Paid plans get faster queues.

---

## Cost

- **Free tier**: 30 builds/month (enough for indie projects)
- **Paid plans**: Unlimited builds, faster queues, priority support

See https://expo.dev/pricing for details.

---

## More Info

- EAS Build docs: https://docs.expo.dev/build/introduction/
- EAS Submit docs: https://docs.expo.dev/submit/introduction/
- EAS Update docs: https://docs.expo.dev/eas-update/introduction/

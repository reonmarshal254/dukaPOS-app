# Android Development Setup

The error `The system cannot find the path specified` when running `npx expo run:android` means Android SDK tools aren't configured.

---

## Quick Fix: Use Expo Go Instead

**If you don't need a development build**, skip the Android SDK setup and use Expo Go:

```bash
npx expo start
```

Then scan the QR code with the **Expo Go** app on your Android phone.

> **Note:** Expo Go doesn't support custom native code. For features like barcode scanning, camera, and secure storage, you need a development build (see below).

---

## Full Setup: Development Build with Android SDK

### 1. Install Java JDK 17

Download and install **Java 17** (LTS):
- https://adoptium.net/temurin/releases/?version=17

After installing, set `JAVA_HOME`:

**Windows:**
1. Open **Environment Variables** (`Win + R` → `sysdm.cpl` → Advanced → Environment Variables)
2. Under **System variables**, click **New**:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot` (adjust to your install path)
3. Add to **Path**: `%JAVA_HOME%\bin`

**Verify:**
```bash
java -version
# Should show: openjdk version "17.x.x"
```

---

### 2. Install Android Studio

Download **Android Studio**: https://developer.android.com/studio

During installation:
- ✅ Android SDK
- ✅ Android SDK Platform
- ✅ Android Virtual Device (AVD)

After installing, open Android Studio:
1. Go to **More Actions** → **SDK Manager**
2. Under **SDK Platforms**, install:
   - ✅ Android 14.0 (API 34)
   - ✅ Android 13.0 (API 33)
3. Under **SDK Tools**, install:
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Command-line Tools

---

### 3. Set ANDROID_HOME

**Windows:**
1. Open **Environment Variables** again
2. Under **System variables**, click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
3. Add to **Path**:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

**Verify:**
```bash
adb version
# Should show: Android Debug Bridge version x.x.x
```

---

### 4. Create an Android Emulator (or use a physical device)

**Option A: Emulator**
1. In Android Studio, go to **More Actions** → **Virtual Device Manager**
2. Click **Create Device**
3. Select **Pixel 5** → **Next**
4. Download **Android 14.0 (API 34)** system image → **Next**
5. Name it → **Finish**
6. Click ▶️ to start the emulator

**Option B: Physical Device**
1. Enable **Developer Options** on your Android phone:
   - Go to **Settings** → **About phone** → Tap **Build number** 7 times
2. Go to **Settings** → **Developer options**
   - Enable **USB debugging**
3. Connect your phone via USB
4. Run `adb devices` — you should see your device listed

---

### 5. Build and Run

**Start the emulator or connect your physical device**, then:

```bash
cd C:\Users\oyooo\POS\mobile
npx expo run:android
```

This will:
1. Generate the `android/` directory (first run only)
2. Install dependencies
3. Build the APK
4. Install on the emulator/device
5. Start the Metro bundler

**First build takes 5-10 minutes.** Subsequent builds are faster.

---

## Common Errors

### `The system cannot find the path specified`
- `JAVA_HOME` or `ANDROID_HOME` not set correctly
- Restart your terminal after setting env vars

### `SDK location not found`
- Run `npx expo-doctor` to diagnose
- Create `android/local.properties`:
  ```properties
  sdk.dir=C:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk
  ```

### `Gradle build failed`
- Run `cd android && ./gradlew clean` (PowerShell: `.\gradlew clean`)
- Delete `android/.gradle` and rebuild

### `No connected devices`
- Emulator: Start it manually in Android Studio first
- Physical: Run `adb devices` — if "unauthorized", check your phone for the USB debugging prompt

---

## Alternative: Use EAS Build (Cloud)

Skip the entire Android SDK setup and build in the cloud:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login (create account at https://expo.dev)
npx eas-cli login

# Initialize
npx eas-cli init

# Build a development APK
npx eas-cli build --profile development --platform android

# Install the APK on your device
npx eas-cli build:run --profile development --platform android
```

The APK downloads to your computer — install it on your phone manually or via `eas build:run`.

This is the recommended approach for:
- Teams without Android SDK setup
- CI/CD pipelines
- Occasional native builds (you still use `npx expo start` for daily dev)

---

## Need Help?

Run diagnostics:
```bash
npx expo-doctor
```

Check Expo docs:
- https://docs.expo.dev/get-started/set-up-your-environment/
- https://docs.expo.dev/workflow/android-studio-emulator/

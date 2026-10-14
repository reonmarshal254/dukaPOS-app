# Fix: App Crashes on Launch

## Problem

App crashes immediately after splash screen with error:
```
UnsatisfiedLinkError: dlopen failed: cannot locate symbol 
"_ZNKR8facebook3jsi5Value8asObjectERNS0_7RuntimeE" 
referenced by "libexpo-av.so"
```

## Root Cause

**Native library mismatch** between React Native JSI and expo-av. This happens when:
1. Dependencies are out of sync after updates
2. Build cache contains old native libraries
3. Expo modules need to be rebuilt

The symbol `_ZNKR8facebook3jsi5Value8asObjectERNS0_7RuntimeE` is a C++ mangled name for a React Native JSI function that expo-av depends on, but it can't find it.

## Solution: Clean Build

### Option 1: Fix Dependencies (Recommended)

```bash
cd mobile

# 1. Fix package versions
npx expo install --check
npx expo install --fix

# 2. Clean everything
Remove-Item -Recurse -Force node_modules, android, ios, .expo -ErrorAction SilentlyContinue

# 3. Reinstall
npm install

# 4. Prebuild native code
npx expo prebuild --clean

# 5. Build fresh APK
npx expo run:android --variant release
```

### Option 2: EAS Build (Cleanest)

```bash
cd mobile

# Build with EAS (always clean)
npx eas-cli build --platform android --profile preview --clear-cache
```

### Option 3: Quick Local Fix

```bash
cd mobile

# Clean native build only
Remove-Item -Recurse -Force android\app\build, .expo -ErrorAction SilentlyContinue

# Rebuild
npx expo prebuild --clean
npx expo run:android
```

## Why This Happens

### The Icon Generation Trigger

When you ran `npm run generate-icons`, it modified files in `assets/`. Then when you built the APK, the build system:

1. ✅ Picked up new icons
2. ❌ Didn't rebuild native modules cleanly
3. ❌ Left expo-av with mismatched JSI bindings

### Native Modules Affected

- `expo-av` (audio/video) - **This is crashing**
- `expo-image`
- `@sentry/react-native`
- Other Expo modules with native code

## Prevention

Always do a **clean build** after:
- Changing assets
- Updating dependencies
- Switching build profiles
- Long time between builds

```bash
# Clean build command (bookmark this)
npx expo prebuild --clean && npx expo run:android --variant release
```

## If Still Crashing

### Check Dependency Versions

```bash
cd mobile
npx expo-doctor
```

Look for warnings about incompatible packages.

### Verify Expo SDK Version

Check `package.json`:
```json
{
  "dependencies": {
    "expo": "~57.0.26"  // SDK 57
  }
}
```

All expo packages should match SDK 57:
```bash
npx expo install expo-av@latest
npx expo install expo-image@latest
# etc.
```

### Check React Native Version

```json
{
  "dependencies": {
    "react-native": "0.86.3"  // Must match Expo SDK 57
  }
}
```

### Nuclear Option: Complete Reset

```bash
cd mobile

# Delete everything
Remove-Item -Recurse -Force node_modules, package-lock.json, android, ios, .expo

# Reinstall from scratch
npm install

# Rebuild
npx expo prebuild
npx expo run:android
```

## Test the Fix

After rebuilding:

1. **Install APK** on device
2. **Launch app** - should show DukaPOS splash
3. **No crash** - app opens to unlock screen
4. **Icons correct** - shows DukaPOS logo (not React logo)

## Future Builds

### Always Use Clean Flag

```bash
# Development builds
npx expo run:android --variant debug

# Release/Preview builds (ALWAYS clean these)
npx expo prebuild --clean
npx expo run:android --variant release
```

### EAS Build (Recommended for Production)

EAS builds are always clean:
```bash
npx eas-cli build --platform android --profile production
```

No cache issues, no native library mismatches.

## Understanding the Error

The cryptic symbol name is C++ name mangling:
```
_ZNKR8facebook3jsi5Value8asObjectERNS0_7RuntimeE
```

Decoded:
```cpp
facebook::jsi::Value::asObject(facebook::jsi::Runtime&) const
```

This is a core React Native JSI (JavaScript Interface) method that allows native modules to convert JavaScript values to native objects. When expo-av can't find this symbol, it means the React Native core and Expo modules are out of sync.

## Summary

**Problem**: Native library mismatch after asset changes  
**Solution**: Clean build with `--clean` flag  
**Prevention**: Always clean build for releases  
**Best Practice**: Use EAS build for production  

Run the clean build commands above and your app will launch successfully! 🚀

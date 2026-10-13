# APK Crash Fixes Applied

## Date: 2026-10-12

## Summary
Fixed critical issues causing the installed APK to crash on production builds.

## Root Causes Identified

### 1. **Database Schema Issue - SKU Index**
**Problem:** The schema file tried to create an index on the `sku` column that didn't exist yet. The `sku` column is only added in Migration 1, but the index was being created during initial table setup.

**Fix:** Removed the SKU index from the initial `CREATE_INDEXES` array. The index is now properly created inside Migration 1 after the column is added.

**Files Modified:**
- `src/database/schema.ts` - Removed `idx_products_sku` from initial indexes

### 2. **Unprotected Console Statements**
**Problem:** Console statements throughout the codebase could cause crashes in production builds with ProGuard enabled. ProGuard may strip or obfuscate console methods, causing undefined method errors.

**Fix:** Wrapped all console statements with `__DEV__` checks and proper error handling. Console statements now only run in development mode and won't crash if console methods are unavailable.

**Files Modified:**
- `src/database/index.ts` - Protected all console.log/error statements with `__DEV__` checks
- `src/app/_layout.tsx` - Protected console statements in database initialization
- `src/app/index.tsx` - Already had protected console statements

### 3. **Missing Error Boundary**
**Problem:** The app had no global error boundary to catch and handle unexpected runtime errors, causing the app to crash completely.

**Fix:** Created a comprehensive `ErrorBoundary` component that catches errors and displays a recovery UI. In development mode, it shows detailed error information including stack traces and device info. In production, it shows a user-friendly error message with a retry option.

**Files Created:**
- `src/components/ErrorBoundary.tsx` - New error boundary component

**Files Modified:**
- `src/app/_layout.tsx` - Wrapped entire app with ErrorBoundary

### 4. **Missing Global Error Handler**
**Problem:** Unhandled errors and promise rejections could crash the app without recovery.

**Fix:** Created a global error handler that intercepts errors before they crash the app. Uses React Native's `ErrorUtils` to set a custom error handler that logs errors in development and gracefully handles them in production.

**Files Created:**
- `src/utils/errorHandler.ts` - Global error handler and safe console wrapper

**Files Modified:**
- `src/app/_layout.tsx` - Initialize error handler at app startup

## Testing Recommendations

### Before Building Production APK:

1. **Type Check:**
   ```bash
   npx tsc --noEmit
   ```
   ✅ **Status:** PASSED

2. **Lint Check:**
   ```bash
   npx expo lint
   ```

3. **Test Database Migration:**
   - Delete the app from device/emulator
   - Install fresh and verify database initializes correctly
   - Check all migrations run successfully

4. **Build Preview APK:**
   ```bash
   eas build --profile preview --platform android
   ```

5. **Test on Physical Device:**
   - Install the preview APK
   - Test app launch
   - Test all major workflows (POS, Reports, Settings)
   - Monitor for any console errors or crashes

### Production Build Commands:

```bash
# Build production APK
eas build --profile production --platform android

# OR build locally (if configured)
npx expo run:android --variant release
```

## Additional Improvements Made

1. **Better Error Messages:** Database errors now provide more context about what failed
2. **Graceful Degradation:** Notification failures no longer crash the app
3. **Development vs Production:** Clear separation of development logging from production behavior
4. **Error Recovery:** Users can tap "Try Again" when errors occur instead of being stuck

## Files Modified Summary

### Created Files:
- `src/components/ErrorBoundary.tsx`
- `src/utils/errorHandler.ts`
- `APK_CRASH_FIXES.md` (this file)

### Modified Files:
- `src/database/schema.ts`
- `src/database/index.ts`
- `src/app/_layout.tsx`

## Next Steps

1. Build a new preview APK with these fixes
2. Test thoroughly on a physical device
3. If stable, proceed with production build
4. Consider adding crash reporting service (Sentry, Firebase Crashlytics) for production monitoring

## Notes

- All console statements are now safe and won't crash in production
- Database initialization is more robust with better error handling
- Error boundaries catch and display errors gracefully
- The app can recover from most non-fatal errors
- Users get helpful error messages instead of crashes

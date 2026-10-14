# Fix DukaPOS App Icons

## Problem
The installed APK shows React's default launcher icon instead of the DukaPOS logo.

## Root Cause
Your `assets/` folder contains the default Expo template icons. You have `dukaPOS-LOGO.jfif` but it's not being used for the app icons.

## Solution

### Required Icon Sizes for Android

**App Icon** (`icon.png`): 1024x1024 px (square)
**Adaptive Icon** (`adaptive-icon.png`): 1024x1024 px (foreground only)
**Notification Icon** (`notification-icon.png`): 96x96 px (white/transparent)
**Splash Screen** (`splash.png`): 1284x2778 px (or similar)

### Option 1: Use Online Icon Generator (Easiest)

1. **Prepare your logo**:
   - Convert `dukaPOS-LOGO.jfif` to PNG with transparent background
   - Use https://cloudconvert.com/jfif-to-png or similar

2. **Generate icons**:
   - Go to https://icon.kitchen or https://easyappicon.com
   - Upload your PNG logo
   - Generate all required sizes
   - Download the package

3. **Replace icons**:
   ```
   mobile/assets/
   ├── icon.png              (1024x1024) - Main app icon
   ├── adaptive-icon.png     (1024x1024) - Android adaptive icon
   ├── notification-icon.png (96x96)     - Notification icon
   ├── splash.png            (1284x2778) - Splash screen
   └── favicon.png           (48x48)     - Web favicon
   ```

### Option 2: Use ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Convert JFIF to PNG
magick assets/dukaPOS-LOGO.jfif -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/icon.png

# Create adaptive icon (same as icon)
copy assets/icon.png assets/adaptive-icon.png

# Create notification icon (smaller, monochrome recommended)
magick assets/icon.png -resize 96x96 assets/notification-icon.png

# Create splash screen (centered logo on blue background)
magick -size 1284x2778 xc:"#2563EB" assets/icon.png -resize 512x512 -gravity center -composite assets/splash.png
```

### Option 3: Use Expo's Asset Generator

Expo can generate all sizes from a single high-res image:

```bash
cd mobile
npx expo-optimize
```

But you need to replace the source icon first.

### Option 4: Manual Design (Recommended for Best Quality)

**Using Figma/Photoshop/GIMP**:

1. **icon.png** (1024x1024):
   - Square canvas: 1024x1024 px
   - Place your logo centered
   - Add some padding (logo should be ~70% of canvas)
   - Export as PNG with transparency

2. **adaptive-icon.png** (1024x1024):
   - Same as icon.png
   - Android will apply its own masking
   - Logo should fit in "safe zone" (center 70%)

3. **notification-icon.png** (96x96):
   - Simple, monochrome version of your logo
   - White on transparent background
   - Very simple design (will be tiny in status bar)

4. **splash.png** (1284x2778):
   - Portrait orientation
   - Blue background (#2563EB)
   - Logo centered
   - Logo size: ~400x400 px

## Quick Fix: Replace with Temporary Icon

If you just want to test quickly, you can use a simple colored square:

```bash
cd mobile/assets

# Create a simple blue square with white "D" (using PowerShell + .NET)
# This requires PowerShell 7+ with System.Drawing

# Or use an online tool like https://www.favicon-generator.org/
```

## After Replacing Icons

### 1. Clear Build Cache
```bash
cd mobile
rm -rf android/app/build
rm -rf .expo
```

### 2. Rebuild the App
```bash
# For EAS Build
npx eas-cli build --platform android --profile preview

# For local build
npx expo prebuild --clean
npx expo run:android
```

### 3. Verify Icons

**In Android Studio**:
- Open `android/` folder
- Navigate to `app/src/main/res/`
- Check `mipmap-*` folders for generated icons

**On Device**:
- Install the new APK
- Check home screen icon
- Check app switcher icon
- Pull down notification shade and send a test notification

## Icon Design Best Practices

### ✅ Do:
- Use simple, recognizable logo
- Ensure good contrast
- Test on different Android versions
- Use proper safe zones for adaptive icons
- Make notification icon monochrome

### ❌ Don't:
- Use text-heavy designs (hard to read at small sizes)
- Use complex gradients (may not scale well)
- Forget padding (icons look better with breathing room)
- Use JPG (always use PNG with transparency)

## Android Adaptive Icon Safe Zones

Android masks adaptive icons into different shapes (circle, squircle, rounded square).

**Safe Zone**: Keep important elements in center 66% of canvas
**Full Canvas**: 1024x1024 px
**Safe Zone**: ~672x672 px centered

```
┌─────────────────────┐
│                     │
│   ┌───────────┐     │
│   │           │     │  ← Safe zone (66%)
│   │   LOGO    │     │     Everything here visible
│   │           │     │     on all device shapes
│   └───────────┘     │
│                     │
└─────────────────────┘
```

## Testing Icons

After building, test on multiple devices/Android versions:
- Different launcher apps (Samsung, Nova, Pixel)
- Light and dark themes
- Different icon shapes
- In app drawer
- In recent apps
- In notifications

## Common Issues

### Issue: Icons still show React logo after rebuilding
**Solution**: 
- Clear Android build cache
- Uninstall old app completely
- Rebuild with `--clean` flag

### Issue: Icons look stretched or pixelated
**Solution**: 
- Use higher resolution source image
- Ensure exact dimensions (1024x1024)
- Export with proper DPI (at least 72 dpi)

### Issue: Adaptive icon looks cut off
**Solution**:
- Add more padding to logo
- Keep important elements in center 66%
- Test with Android's icon shape preview tool

## Recommended Workflow

1. **Design** icons in Figma/Photoshop (1024x1024)
2. **Export** all required sizes
3. **Replace** files in `mobile/assets/`
4. **Clear** `.expo` and `android/app/build` folders
5. **Build** new APK with EAS or locally
6. **Test** on actual device
7. **Iterate** if needed

## Your Next Steps

1. Convert `dukaPOS-LOGO.jfif` to high-res PNG
2. Generate all required icon sizes
3. Replace files in `mobile/assets/`
4. Rebuild APK: `npx eas-cli build --platform android --profile preview`
5. Install and verify

Need help with icon design? Let me know what format you have and I can guide you through the conversion!

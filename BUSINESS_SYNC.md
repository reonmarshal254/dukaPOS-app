# Automatic Business Registration & Device Sync

This document explains the automatic business registration and device details synchronization to the admin backend.

## Overview

The app now automatically syncs business registration and device details to the admin backend (`https://dukapos-gjfx.onrender.com`) when it detects internet connectivity. If a user doesn't have a business ID, the system auto-generates one.

## Key Features

### 1. **Auto-Generation of Business ID**
- If no business record exists in the database, the system auto-generates:
  - A unique UUID as the business ID
  - Placeholder business data (name: "My Business", etc.)
- The business ID is stored securely and persists across app restarts
- Users can update the business details later from the settings

### 2. **Online Detection**
- Uses `expo-network` to detect internet connectivity
- Checks both `isConnected` and `isInternetReachable` states
- Only attempts sync when truly online

### 3. **Automatic Sync Triggers**
- **App startup** - When app launches with internet
- **Network restoration** - When device comes back online
- **App foreground** - When app returns from background
- **After business setup** - Immediate sync after user completes setup
- **Periodic checks** - Every 2 minutes when app is active

### 4. **Smart Sync Logic**
- **Minimum interval**: 5 minutes between sync attempts (prevents spam)
- **Retry tracking**: Counts failed attempts for monitoring
- **Fire-and-forget**: Never blocks the UI
- **Comprehensive logging**: All sync attempts are logged for debugging

### 5. **Data Synced to Admin Backend**

**Business Details:**
- Business name
- Owner name
- Phone number
- Location

**Device Details:**
- Device ID (stable across reinstalls)
- Device name
- Device model
- OS name and version
- App version and build number
- Platform (Android/iOS)
- Physical device flag

## Implementation Files

### New Files Created

1. **`src/services/businessSync.ts`**
   - `ensureBusinessID()` - Ensures business ID always exists
   - `hasPlaceholderData()` - Checks if business has auto-generated data
   - Auto-generates business with placeholder data if needed

2. **`src/hooks/useNetworkListener.ts`**
   - Monitors network connectivity changes
   - Listens to app state changes (foreground/background)
   - Triggers device refresh when network is restored
   - Periodic network checks every 2 minutes

### Modified Files

1. **`src/hooks/useDevice.ts`**
   - Re-enabled `reportToAdmin()` function (was disabled)
   - Added online detection using `expo-network`
   - Added sync status tracking to prevent redundant calls
   - Added 10-second timeout for backend requests
   - Modified `registerDeviceInDB()` to call `ensureBusinessID()`

2. **`src/app/_layout.tsx`**
   - Added `NetworkSyncProvider` component
   - Integrated `useNetworkListener()` hook at app root level

## Backend Endpoint

The app syncs to: `POST /api/register`

**Payload Example:**
```json
{
  "deviceId": "abc-123-def-456",
  "businessName": "Mama Grace Shop",
  "ownerName": "Grace Wanjiru",
  "phone": "0712345678",
  "location": "Nairobi, Westlands",
  "deviceName": "Samsung Galaxy A10",
  "deviceModel": "SM-A105F",
  "osName": "Android",
  "osVersion": "11",
  "appVersion": "1.0.0",
  "buildNumber": "1",
  "platform": "android",
  "isPhysical": true
}
```

## User Flow

### Scenario 1: New User (No Business Setup Yet)
1. User installs app
2. App auto-generates business ID with placeholder data
3. Device details are registered locally
4. If online, syncs to admin backend immediately
5. User completes business setup later
6. Updated business details sync to admin on next trigger

### Scenario 2: New User (With Business Setup)
1. User installs app
2. User completes business setup
3. Business ID is generated and stored
4. Device registration triggers sync immediately
5. If offline, sync happens when network is restored

### Scenario 3: Existing User (App Restart)
1. App starts
2. Loads existing business ID from secure storage
3. Checks network connectivity
4. If online and 5+ minutes since last sync, syncs to admin
5. Network listener monitors for connectivity changes

### Scenario 4: Offline → Online Transition
1. User uses app offline
2. Network listener detects connectivity restoration
3. Triggers device refresh
4. Syncs business and device details to admin

## Monitoring & Debugging

### Console Logs

**Successful sync:**
```
[useDevice] POST https://dukapos-gjfx.onrender.com/api/register
[useDevice] ✅ Admin sync successful
```

**Offline skip:**
```
[useDevice] Offline — skipping admin sync
```

**Recent sync skip:**
```
[useDevice] Sync attempted recently — skipping
```

**Network restoration:**
```
[networkListener] 🌐 Network restored — triggering device sync
```

**Auto-generation:**
```
[businessSync] ✨ Auto-generated business ID: abc-123-def-456
```

### Sync Status Tracking

The `syncStatus` object tracks:
- `lastSyncAttempt` - Timestamp of last attempt
- `lastSuccessfulSync` - Timestamp of last successful sync
- `retryCount` - Number of consecutive failures

## Configuration

### Admin API URL
Set in `app.config.js`:
```javascript
extra: {
  adminApiUrl: process.env.ADMIN_API_URL || 'https://dukapos-gjfx.onrender.com'
}
```

### Sync Interval
Modify `MIN_SYNC_INTERVAL` in `src/hooks/useDevice.ts` (default: 5 minutes)

### Network Check Interval
Modify interval in `src/hooks/useNetworkListener.ts` (default: 2 minutes)

## Security

- Business ID stored in secure storage (`expo-secure-store`)
- Device ID generated once and reused (stable identifier)
- HTTPS-only communication with backend
- 10-second timeout prevents hanging requests
- No sensitive data in logs (business/device info only)

## Testing

### Test Auto-Generation
1. Fresh install (or clear app data)
2. Skip business setup
3. Check logs for: `[businessSync] ✨ Auto-generated business ID`
4. Verify placeholder data in businesses table

### Test Online Sync
1. Ensure internet connection
2. Launch app
3. Check logs for: `[useDevice] ✅ Admin sync successful`
4. Verify data in backend database

### Test Offline Behavior
1. Enable airplane mode
2. Launch app
3. Check logs for: `[useDevice] Offline — skipping admin sync`
4. Disable airplane mode
5. Check logs for: `[networkListener] 🌐 Network restored`

### Test Network Restoration
1. Start with internet enabled
2. Wait for initial sync
3. Disable internet
4. Re-enable internet after 30 seconds
5. Verify sync triggers automatically

## Future Enhancements

Potential improvements:
- [ ] Exponential backoff for failed sync attempts
- [ ] Background sync using background tasks
- [ ] Sync queue for offline operations
- [ ] User notification on first successful sync
- [ ] Settings toggle to disable auto-sync
- [ ] Manual "Sync Now" button in settings
- [ ] Sync status indicator in UI

## Troubleshooting

### Sync not happening?
1. Check network connectivity
2. Check if 5 minutes have passed since last attempt
3. Verify admin URL in logs
4. Check backend server status

### Auto-generation not working?
1. Verify database is initialized
2. Check `ensureBusinessID()` is called
3. Look for errors in `registerDeviceInDB()`

### Network listener not triggering?
1. Verify `useNetworkListener()` is called in root layout
2. Check expo-network package is installed
3. Test with airplane mode toggle

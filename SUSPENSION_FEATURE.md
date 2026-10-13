# Account Suspension Feature

This document explains the account suspension feature that allows admins to suspend accounts and shows users a modern suspension screen with contact options.

## Overview

When an admin suspends an account in the backend, users trying to unlock the app will be redirected to a suspension screen with:
- Account and device details
- Call support button (direct phone dial)
- WhatsApp support button (pre-filled message)
- Check status button to verify if suspension lifted

## Feature Components

### 1. Backend Endpoint

**New Route**: `GET /api/account-status/:deviceId`

Returns detailed account status including:
```json
{
  "suspended": true,
  "deviceId": "abc-123...",
  "businessName": "Mama Grace Shop",
  "ownerName": "Grace Wanjiru",
  "phone": "0712345678",
  "deviceName": "Samsung Galaxy A10",
  "deviceModel": "SM-A105F",
  "osName": "Android",
  "lastSeenAt": "2024-01-15T10:30:00Z",
  "licenceStatus": "suspended",
  "plan": "monthly"
}
```

### 2. Account Status Service

**File**: `src/services/accountStatusService.ts`

**Key Function**: `checkAccountStatus(deviceId: string)`
- Checks if device is online first
- Only makes API call when internet is available
- Returns `AccountStatus` object or `null` (offline/error)
- 10-second timeout for requests
- Comprehensive logging for debugging

### 3. Suspension Screen

**File**: `src/app/(auth)/suspended.tsx`

**Features**:
- Modern gradient design (red theme for warning)
- Large lock icon in glassmorphic circle
- Account details card showing:
  - Business name
  - Device information
  - Operating system
- **Call Support Button**
  - Opens phone dialer directly
  - Green gradient design
  - Shows phone number: +254742041208
- **WhatsApp Support Button**
  - Opens WhatsApp with pre-filled message
  - Message includes business name, device info, device ID
  - Fallback to web WhatsApp if app not installed
  - Green WhatsApp brand gradient
- **Check Status Button**
  - Queries backend to check if suspension lifted
  - Redirects to unlock if account reactivated
  - Shows loading state while checking

### 4. Unlock Screen Integration

**File**: `src/app/(auth)/unlock.tsx`

**Changes**:
- Added `useDevice()` hook to get device ID
- Added `checkSuspensionStatus()` function
- Checks suspension on screen mount
- Checks suspension before PIN verification
- Redirects to suspension screen if suspended
- Shows "Checking account status..." while checking

## User Flow

### Scenario 1: Suspended Account (First Unlock)
1. User opens app
2. Unlock screen appears
3. App checks account status (if online)
4. If suspended → redirects to suspension screen
5. User sees account details and contact options

### Scenario 2: Suspended After PIN Entry
1. User enters PIN
2. Before unlocking, app checks suspension status
3. If suspended → redirects to suspension screen
4. User cannot access app until reactivated

### Scenario 3: Check Status While Suspended
1. User on suspension screen
2. Taps "Check Status Again"
3. App queries backend
4. If still suspended → shows alert
5. If reactivated → redirects to unlock screen
6. User can now enter PIN and access app

### Scenario 4: Offline Behavior
1. User tries to unlock (offline)
2. Suspension check skips (no internet)
3. User can access app offline
4. Next time online, suspension check runs

## Admin Workflow

### Suspend an Account
```bash
curl -X POST https://dukapos-gjfx.onrender.com/api/admin/suspend \
  -H "x-admin-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "abc-123-def-456"}'
```

### Reactivate an Account
```bash
curl -X POST https://dukapos-gjfx.onrender.com/api/admin/activate \
  -H "x-admin-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "abc-123-def-456", "plan": "monthly"}'
```

## Contact Information

**Support Phone**: +254742041208
- Direct call from app
- Included in WhatsApp message template

**WhatsApp Message Template**:
```
Hello, my DukaPOS account has been suspended.

Business: Mama Grace Shop
Device: Samsung Galaxy A10 (SM-A105F)
OS: Android
Device ID: abc-123...
```

## Technical Details

### Network Detection
- Uses `expo-network` package
- Checks `isConnected` AND `isInternetReachable`
- Only queries backend when truly online

### Error Handling
- Network errors: silently skip check, allow offline access
- 404 errors: device not registered, allow access
- Timeout errors: 10-second limit, fail gracefully
- All errors logged to console for debugging

### Security
- Admin secret required for suspend/activate endpoints
- Device ID verified against database
- No sensitive data exposed in suspension screen
- Phone number only shown if available

### Performance
- Fire-and-forget checks (never blocks UI)
- Quick 10-second timeout
- Cached device info used (no repeated lookups)
- Minimal API calls (only on unlock attempts)

## Testing

### Test Suspension Flow
1. Get device ID from app logs
2. Suspend via admin API
3. Try to unlock app
4. Verify suspension screen appears
5. Test call button
6. Test WhatsApp button
7. Test "Check Status" button

### Test Reactivation
1. While on suspension screen
2. Admin reactivates account
3. User taps "Check Status Again"
4. Verify redirect to unlock screen
5. Enter PIN and verify app access

### Test Offline Behavior
1. Enable airplane mode
2. Try to unlock app
3. Verify no suspension check (offline)
4. User can access app
5. Disable airplane mode
6. Try to unlock again
7. Verify suspension check runs

### Test Contact Buttons
1. **Call Button**: Verify phone dialer opens with correct number
2. **WhatsApp Button**: Verify WhatsApp opens with pre-filled message
3. **Web Fallback**: Uninstall WhatsApp, verify web WhatsApp opens

## UI Design

### Color Scheme
- **Suspension Screen**: Red gradient (#FF6B6B → #C92A2A)
- **Call Button**: Green gradient (#4CAF50 → #2E7D32)
- **WhatsApp Button**: WhatsApp green (#25D366 → #128C7E)
- **Check Status**: Translucent white with border

### Layout
- Responsive scrollable content
- Safe area handling
- Glassmorphic card for account details
- Large touch targets for buttons
- Clear visual hierarchy
- Emoji icons for status indicators

### Accessibility
- High contrast text on gradient
- Large readable fonts
- Clear button labels
- Icon + text for all actions
- Descriptive error messages

## Logging

### Console Output

**Online Check**:
```
[accountStatus] Checking status for device: abc-123...
[accountStatus] Status: 🔒 SUSPENDED
```

**Offline Skip**:
```
[accountStatus] Offline — skipping suspension check
```

**Status Check Success**:
```
[accountStatus] Status: ✅ Active
```

**Network Error**:
```
[accountStatus] Check error: Network request failed
```

## Future Enhancements

Potential improvements:
- [ ] Email support option
- [ ] In-app chat with support
- [ ] Suspension reason display
- [ ] Appeal suspension button
- [ ] Estimated reactivation time
- [ ] Push notification when reactivated
- [ ] Suspension history log
- [ ] Custom suspension messages from admin
- [ ] Temporary vs permanent suspension indicators
- [ ] Grace period countdown before full suspension

## Troubleshooting

### Suspension screen not appearing?
1. Check internet connection
2. Verify backend is reachable
3. Check device ID in logs
4. Verify suspension in backend database

### Call button not working?
1. Check phone permissions
2. Verify tel: URL scheme supported
3. Test on physical device (not simulator)

### WhatsApp button not working?
1. Verify WhatsApp installed
2. Check if whatsapp:// scheme supported
3. Web fallback should work on all devices

### Status check always fails?
1. Verify internet connection
2. Check backend endpoint status
3. Look for timeout errors in logs
4. Verify device ID is correct

## Backend Database

Suspension is tracked in the `licences` table:
```sql
SELECT * FROM licences WHERE device_id = 'abc-123-def-456';
-- status can be: 'active', 'suspended', 'expired'
```

To suspend manually:
```sql
UPDATE licences 
SET status = 'suspended', updated_at = NOW() 
WHERE device_id = 'abc-123-def-456';
```

To reactivate:
```sql
UPDATE licences 
SET status = 'active', updated_at = NOW() 
WHERE device_id = 'abc-123-def-456';
```


## Backend Availability and Graceful Degradation

### Fail-Open Design

The suspension check is designed to **fail open** - meaning if the backend is unreachable, the app allows access rather than blocking the user.

**Behavior**:
- ✅ Backend reachable + account active → Allow access
- ✅ Backend reachable + account suspended → Show suspension screen
- ✅ Backend unreachable/timeout → Allow access (fail open)
- ✅ Backend returns HTML/error → Allow access (fail open)
- ✅ Device offline → Allow access (skip check)

### Why Fail-Open?

1. **User Experience**: Users shouldn't be locked out due to temporary backend issues
2. **Offline Support**: App works fully offline
3. **Render Free Tier**: Backend may sleep after inactivity (takes 30-60s to wake up)
4. **Network Issues**: Poor connectivity shouldn't block legitimate users

### Error Handling

The mobile app now includes enhanced error handling:

**Checks performed**:
1. ✅ Online detection (skip if offline)
2. ✅ Response status code validation
3. ✅ Content-Type header validation (must be `application/json`)
4. ✅ JSON parsing with try/catch
5. ✅ Timeout protection (10 seconds)

**Logged information**:
- Request URL
- Response status code
- Content-Type header
- Response body preview (first 200 chars if not JSON)
- Error messages

**Example log output** (backend returning HTML):
```
[accountStatus] Checking status for device: abc-123...
[accountStatus] URL: https://dukapos-gjfx.onrender.com/api/account-status/abc-123-def-456
[accountStatus] Response is not JSON, got: text/html
[accountStatus] Response body preview: <!DOCTYPE html><html><head><title>Service Unavailable</title>...
```

### Backend Wake-Up

**Render Free Tier Behavior**:
- Services sleep after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast

**Mobile App Handling**:
- 10-second timeout prevents long waits
- Returns `null` on timeout
- User can access app immediately
- Next unlock attempt will retry (backend likely awake by then)

### Testing Different Scenarios

**1. Backend Online and Active**:
- Response: `200 OK` with JSON
- App: Checks suspension status correctly

**2. Backend Asleep (Render)**:
- Response: Timeout or HTML error page
- App: Logs warning, allows access
- Next attempt: Backend awake, check succeeds

**3. Backend Error (500)**:
- Response: `500 Internal Server Error`
- App: Logs warning, allows access

**4. Device Not Found (404)**:
- Response: `404 Not Found` with JSON
- App: Logs "Device not found", allows access

**5. Account Suspended**:
- Response: `200 OK` with `{"suspended": true, ...}`
- App: Redirects to suspension screen

**6. Device Offline**:
- No network request made
- App: Skips check, allows access

### Production Recommendations

For production deployment with paid hosting (always-on):

1. **Use always-on hosting** (not Render free tier)
2. **Add health check monitoring** (e.g., UptimeRobot)
3. **Set up error alerting** (Sentry for backend)
4. **Consider caching** suspension status for 5-10 minutes
5. **Add retry logic** with exponential backoff

### Current Implementation Status

✅ Mobile app has robust error handling
✅ Gracefully handles all error scenarios
✅ Logs detailed debugging information
✅ Never blocks legitimate users due to backend issues
✅ Works perfectly offline
⚠️ Backend may be slow on first request (Render free tier)

The suspension feature is **production-ready** with fail-open semantics. It will enforce suspensions when the backend is reachable, but won't block users when it's not.

# 🎯 Visual Guide: Get Your Sentry DSN

## Your Run Code: `96e26f48ef`

---

## 🚀 Quick Path (Use Your Run Code)

### STEP 1: Open Sentry Onboarding
Copy and paste this URL in your browser:
```
https://sentry.io/onboarding/mcokoth-technologies/
```

**What you'll see:**
```
┌────────────────────────────────────┐
│   Welcome to Sentry               │
│                                   │
│   Enter your run code:            │
│   [_______________]               │
│                                   │
│   [Continue]                      │
└────────────────────────────────────┘
```

### STEP 2: Enter Run Code
Type: `96e26f48ef`
Click: **Continue**

---

### STEP 3: Create Project
**What you'll see:**
```
┌────────────────────────────────────┐
│   Create a Project                │
│                                   │
│   Select a platform:              │
│   ○ JavaScript                    │
│   ● React-Native  ← SELECT THIS  │
│   ○ Python                        │
│   ○ Node.js                       │
│                                   │
│   Project name:                   │
│   [dukapos-mobile]                │
│                                   │
│   [Create Project]                │
└────────────────────────────────────┘
```

Fill in:
- Platform: **React-Native** ✓
- Project name: `dukapos-mobile`
- Click: **Create Project**

---

### STEP 4: Copy Your DSN
**What you'll see:**
```
┌────────────────────────────────────────────────────────────┐
│   Setup Sentry for React Native                           │
│                                                            │
│   1. Install Sentry                                        │
│      npm install @sentry/react-native                      │
│                                                            │
│   2. Initialize Sentry                                     │
│      Sentry.init({                                        │
│        dsn: "https://abc123@def456.ingest.sentry.io/789", │
│             ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑      │
│             THIS IS YOUR DSN - COPY IT!                    │
│      });                                                   │
│                                                            │
│   [Continue]                                               │
└────────────────────────────────────────────────────────────┘
```

**Copy the entire DSN URL** - it looks like:
```
https://1234567890abcdef1234567890abcdef@o1234567.ingest.sentry.io/1234567
```

---

### STEP 5: Configure Your App

Open terminal and run:
```bash
cd c:\Users\oyooo\POS\mobile
npm run sentry-config
```

**What you'll see:**
```
🔍 Sentry DSN Configuration Helper

Organization: mcokoth-technologies
Project: dukapos-mobile

Get your DSN from:
https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/

Paste your Sentry DSN here: _
```

**Paste your DSN** (the one you copied in Step 4)
Press Enter

**Output:**
```
✅ Valid DSN received!

Updating configuration files...

✅ Updated .env
✅ Updated .env.production
✅ Updated eas.json

🎉 Sentry DSN configured successfully!
```

---

## ✅ You're Done!

Now test it:
```bash
npx expo start
```

Then in any screen, temporarily add:
```typescript
import { testSentry } from '../services/sentryService';
testSentry();
```

Check your Sentry dashboard - you should see the test error!

---

## 🔄 Alternative: Find DSN in Dashboard

If you already created the project, find your DSN here:

### Visual Path:
```
1. Go to: https://sentry.io
   ↓
2. Login
   ↓
3. Select organization: mcokoth-technologies
   ↓
4. Click "Projects" (left sidebar)
   ↓
5. Click "dukapos-mobile"
   ↓
6. Click "Settings" (gear icon)
   ↓
7. Click "Client Keys (DSN)" (left menu)
   ↓
8. Copy the DSN shown under "DSN"
```

**Or use direct link:**
```
https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/
```

---

## 📋 DSN Format Example

Your DSN should look like this:
```
https://[PUBLIC_KEY]@[HOST].ingest.sentry.io/[PROJECT_ID]
       ↑              ↑                        ↑
    32 hex chars   organization ID          project ID

Example:
https://1a2b3c4d5e6f7890abcdef1234567890@o1234567.ingest.sentry.io/4567890
```

**Parts:**
- `1a2b3c4d5e6f7890abcdef1234567890` = Public Key (32 characters)
- `o1234567` = Organization ID
- `4567890` = Project ID

---

## ❌ Common Mistakes

### ❌ Wrong:
```
SENTRY_DSN=
```
(Empty - won't work)

### ❌ Wrong:
```
SENTRY_DSN=abc123
```
(Just the key - needs full URL)

### ✅ Correct:
```
SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012
```
(Full URL starting with https://)

---

## 🎯 Quick Reference

**Your Details:**
- Organization: `mcokoth-technologies`
- Project Name: `dukapos-mobile`
- Run Code: `96e26f48ef`

**Key URLs:**
- Create Project: https://sentry.io/onboarding/mcokoth-technologies/
- Get DSN: https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/
- Dashboard: https://mcokoth-technologies.sentry.io/

**Command:**
```bash
npm run sentry-config
```

---

## 🎊 Next Steps After Configuration

1. ✅ DSN configured
2. Test: `testSentry()` in dev
3. Build: `eas build --profile preview --platform android`
4. Install on device
5. Check Sentry dashboard for crashes

---

**Need help? Check `GET_SENTRY_DSN.md` for more options!**

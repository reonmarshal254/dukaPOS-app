# 🔑 How to Get Your Sentry DSN - Step by Step

## You have the run code: `96e26f48ef`

Let's use this to set up Sentry properly.

---

## Option 1: Use Your Run Code (EASIEST)

### Step 1: Go to Sentry Onboarding
Visit this URL directly:
```
https://sentry.io/onboarding/mcokoth-technologies/
```

### Step 2: Enter Your Run Code
- You'll see a screen asking for a "Run code"
- Enter: `96e26f48ef`
- Click "Continue"

### Step 3: Select Platform
- Choose: **React Native**
- Project name: `dukapos-mobile`
- Click "Create Project"

### Step 4: Copy Your DSN
- After project creation, you'll see a DSN like:
  ```
  https://xxxxxxxxxxxxxxxxxxxxx@yyyyyyyyyyyyy.ingest.sentry.io/zzzzzz
  ```
- Copy this entire string

### Step 5: Configure Your App
Run this command and paste the DSN when prompted:
```bash
cd c:\Users\oyooo\POS\mobile
npm run sentry-config
```

✅ Done!

---

## Option 2: Manual Setup (If Option 1 Doesn't Work)

### Step 1: Login to Sentry
1. Go to: https://sentry.io/auth/login/
2. Login with your Sentry account
3. Select organization: `mcokoth-technologies`

### Step 2: Create New Project
1. Click "Projects" in the left sidebar
2. Click "Create Project" button (top right)
3. Platform: Select **React Native**
4. Project name: Enter `dukapos-mobile`
5. Team: Select your team (or "Default")
6. Click "Create Project"

### Step 3: Get Your DSN
After project creation, you'll be on the setup page:
1. Look for the code snippet that says `Sentry.init`
2. Find the line with `dsn:`
3. Copy the DSN URL (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

**Or navigate directly to:**
```
https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/
```

### Step 4: Configure Your App
Run this command and paste the DSN when prompted:
```bash
cd c:\Users\oyooo\POS\mobile
npm run sentry-config
```

---

## Option 3: I'll Do It Manually

If you prefer to manually add the DSN:

### 1. Get your DSN from Sentry (use Option 1 or 2 above)

### 2. Edit `.env` file:
```bash
# Open: c:\Users\oyooo\POS\mobile\.env
# Find this line:
SENTRY_DSN=

# Replace with:
SENTRY_DSN=https://your-actual-dsn-here@xxxx.ingest.sentry.io/xxxx
```

### 3. Edit `.env.production` file:
```bash
# Open: c:\Users\oyooo\POS\mobile\.env.production
# Find this line:
SENTRY_DSN=

# Replace with:
SENTRY_DSN=https://your-actual-dsn-here@xxxx.ingest.sentry.io/xxxx
```

### 4. Edit `eas.json` file:
```json
// Open: c:\Users\oyooo\POS\mobile\eas.json
// Find all three "SENTRY_DSN": "" entries and replace with:
"SENTRY_DSN": "https://your-actual-dsn-here@xxxx.ingest.sentry.io/xxxx"
```

---

## 🧪 Test Your Setup

After adding the DSN:

```bash
# 1. Start the app
npx expo start

# 2. In any screen, add this code temporarily:
import { testSentry } from '../services/sentryService';
testSenty();

# 3. Check your Sentry dashboard
# You should see a test error appear!
```

---

## 🔍 Finding Your DSN Later

If you ever need to find your DSN again:

1. **Direct Link:**
   ```
   https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/
   ```

2. **Navigation:**
   - Go to: https://sentry.io
   - Login → Select `mcokoth-technologies`
   - Click "Projects" → Select `dukapos-mobile`
   - Click "Settings" → Click "Client Keys (DSN)"
   - Copy the DSN under "DSN"

---

## ❓ Common Issues

### "Project doesn't exist"
- The project hasn't been created yet
- Use Option 1 with your run code to create it
- Or use Option 2 to create manually

### "I don't have access"
- Make sure you're logged into Sentry
- Make sure you have access to `mcokoth-technologies` organization
- Ask the organization owner to invite you

### "Run code doesn't work"
- Run code might have expired
- Use Option 2 to create project manually
- Contact Sentry support for a new run code

---

## 📞 Need Help?

**Your Setup:**
- Organization: `mcokoth-technologies`
- Project: `dukapos-mobile` (needs to be created)
- Run Code: `96e26f48ef`

**Sentry Support:**
- Help Center: https://help.sentry.io/
- Community Forum: https://forum.sentry.io/

---

## ✅ Quick Checklist

Once you have your DSN:

- [ ] DSN obtained from Sentry dashboard
- [ ] Run `npm run sentry-config` and paste DSN
- [ ] Or manually update `.env`, `.env.production`, and `eas.json`
- [ ] Test with `testSentry()` in development
- [ ] Build APK: `eas build --profile preview --platform android`
- [ ] Verify crash reporting works

---

**Start with Option 1 using your run code!** 🚀

It's the fastest way to get set up.

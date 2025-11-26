# Fix Vercel Deployment Issue

## The Problem

You're seeing: "Configuration Settings in the current Production deployment differ from your current Project Settings."

This happens when Vercel's auto-detection doesn't match your project structure.

## Solution: Configure Root Directory

Since your web app is in the `web-app` folder, you need to tell Vercel where to find it.

### Step 1: Go to Project Settings

1. In Vercel Dashboard, click on your project
2. Go to **Settings** tab
3. Click on **General** in the left sidebar
4. Scroll down to **Root Directory**

### Step 2: Set Root Directory

1. Click **"Edit"** next to **Root Directory**
2. Select **"Set to different directory"**
3. Enter: `web-app`
4. Click **"Save"**

### Step 3: Update Project Settings

While you're in Settings, verify these settings:

1. Go to **General** settings
2. Verify:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `web-app` ✅
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 4: Redeploy

After changing the root directory:

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or make a small change and push to trigger a new deployment

---

## Alternative: Fix in Project Settings UI

If you see "Production Overrides" in the Framework Settings:

1. Click on **"Production Overrides"** to expand it
2. Check what settings are different
3. Go to **Project Settings** instead
4. Update the settings there to match what you want

---

## Quick Fix Commands

If using Vercel CLI:

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage/web-app"
vercel --cwd . --prod
```

Or if in root directory:

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage"
vercel --cwd web-app --prod
```

---

## Verify Configuration

After setting root directory, verify:

1. **Root Directory** = `web-app`
2. **Build Command** = `npm run build` 
3. **Output Directory** = `dist`
4. **Install Command** = `npm install`

These should match what's in `web-app/package.json`.

---

## If Still Having Issues

1. Delete the deployment and redeploy fresh
2. Or delete the project in Vercel and re-import from GitHub
3. Make sure to set Root Directory during import

The key is: **Root Directory must be set to `web-app`** in Vercel project settings!


# Fix: Deployments Going to Wrong URL

## Problem

Your GitHub repository is deploying to:
- ❌ `https://car-mileage-delta.vercel.app/` (wrong)

But you want:
- ✅ `https://car-mileage-seven.vercel.app/` (correct)

## Solution

Your GitHub repo is connected to the **wrong Vercel project**. You need to connect it to `car-mileage-seven` instead.

---

## Step-by-Step Fix

### Step 1: Connect GitHub to `car-mileage-seven`

1. **Open Git Settings for the correct project:**
   ```
   https://vercel.com/mike-hills-projects-d31a9ef5/car-mileage-seven/settings/git
   ```

2. **Click "Connect Git Repository"** (or "Change Git Repository" if already connected)

3. **Select your repository:**
   - Repository: `liquidgolf-cmd/car_mileage`
   - Production Branch: `main`
   - Root Directory: `web-app`
   - Click **"Connect"**

4. **Verify settings:**
   - Production Branch: `main` ✅
   - Root Directory: `web-app` ✅

---

### Step 2: Disconnect `car-mileage-delta` (Optional)

If you don't need `car-mileage-delta` project anymore:

1. **Go to the wrong project:**
   ```
   https://vercel.com/mike-hills-projects-d31a9ef5/car-mileage-delta/settings/git
   ```

2. **Disconnect GitHub:**
   - Find "Git Repository" section
   - Click "..." menu
   - Click **"Disconnect"**
   - Confirm

This will stop deployments to `car-mileage-delta`.

---

### Step 3: Trigger a New Deployment

After connecting, push to GitHub to trigger deployment:

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage"
git commit --allow-empty -m "Trigger deployment to car-mileage-seven"
git push origin main
```

Or just make a small change and push - Vercel will automatically deploy.

---

### Step 4: Verify

1. **Check Vercel Dashboard:**
   - Go to: https://vercel.com/mike-hills-projects-d31a9ef5/car-mileage-seven
   - Check "Deployments" tab
   - You should see a new deployment starting

2. **Wait for deployment** (usually 1-2 minutes)

3. **Visit the correct URL:**
   - https://car-mileage-seven.vercel.app
   - Your app should be there!

---

## Why This Happened

You likely have multiple Vercel projects:
- `car-mileage-seven` (the one you want)
- `car-mileage-delta` (the one currently connected)

Vercel automatically creates projects when you deploy, and your GitHub repo got connected to the wrong one.

---

## After Fixing

✅ All future pushes to `main` will deploy to: `car-mileage-seven.vercel.app`  
✅ The wrong project (`car-mileage-delta`) will stop receiving deployments (if disconnected)

---

## Quick Links

- **Correct Project Settings:**
  https://vercel.com/mike-hills-projects-d31a9ef5/car-mileage-seven/settings/git

- **Correct Project Dashboard:**
  https://vercel.com/mike-hills-projects-d31a9ef5/car-mileage-seven

- **Correct Production URL:**
  https://car-mileage-seven.vercel.app

---

## Still Having Issues?

If deployments still go to the wrong URL:

1. Check which project has the webhook in GitHub:
   - Go to: https://github.com/liquidgolf-cmd/car_mileage/settings/hooks
   - See which Vercel project URL is there

2. Make sure only `car-mileage-seven` is connected

3. Disconnect all other projects from this GitHub repo


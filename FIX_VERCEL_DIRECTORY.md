# Fix Vercel Root Directory Mismatch

## Current Situation
- **Local folder**: `web-app` ✅
- **Vercel setting**: `car-mileage-web-app` ❌ (doesn't match!)

## Solution Options

### Option 1: Change Vercel to Match Local (EASIEST) ⭐

Change Vercel Root Directory back to `web-app`:

1. Go to Vercel Dashboard → Your Project
2. Settings → **Build and Deployment**
3. Find **Root Directory**
4. Click **"Edit"**
5. Change from `car-mileage-web-app` to `web-app`
6. Click **"Save"**
7. Redeploy

### Option 2: Rename Local Folder to Match Vercel

If you want to keep `car-mileage-web-app` in Vercel, rename the folder locally:

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage"
mv web-app car-mileage-web-app
git add .
git commit -m "Rename web-app to car-mileage-web-app"
git push
```

Then update Vercel Root Directory to: `car-mileage-web-app`

---

## Recommendation

**Use Option 1** - Just change Vercel back to `web-app` since that's what you already have locally. It's simpler and requires no file changes.


# Fix 404 Error on Vercel

## The Problem
Getting "404: NOT_FOUND" error when accessing your Vercel deployment.

## Step-by-Step Fix

### 1. Verify Vercel Project Settings

Go to **Vercel Dashboard → Your Project → Settings → Build and Deployment**

Check these settings match exactly:

| Setting | Should Be |
|---------|-----------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `web-app` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2. Check Build Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Build Logs"** tab
4. Look for:
   - ✅ **Success messages** - Build completed successfully?
   - ❌ **Error messages** - Any build failures?
   - 📁 **File paths** - Are files being found in `web-app/`?

### 3. Verify Files Are Built

In the Build Logs, you should see:
```
✓ built in X.XXs
```

And files like:
```
dist/index.html
dist/assets/index-*.js
dist/assets/index-*.css
```

If you see errors, that's the problem!

### 4. Redeploy After Settings Change

After verifying/updating settings:

1. **Save** all settings
2. Go to **Deployments** tab
3. Click **"..."** menu on latest deployment
4. Click **"Redeploy"**
5. Wait for build to complete

### 5. Check Deployment Status

- 🟢 **Green checkmark** = Success (but still 404? Continue to step 6)
- 🔴 **Red X** = Failed (check Build Logs for errors)

### 6. Verify vercel.json

The `web-app/vercel.json` file should contain:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

✅ This file is already correct in your repo!

### 7. Check What URL You're Visiting

Are you visiting:
- ❌ `https://your-project.vercel.app/some-path` (might 404 if routing broken)
- ✅ `https://your-project.vercel.app/` (should work)

Try visiting just the root URL first!

### 8. Common Issues & Fixes

#### Issue: "Build Command failed"
**Fix**: Make sure Build Command = `npm run build`

#### Issue: "Cannot find package.json"
**Fix**: Root Directory must be `web-app` (not `/web-app` or `web-app/`)

#### Issue: "Output Directory not found"
**Fix**: Output Directory must be `dist` (Vite's default output)

#### Issue: "Framework Preset is wrong"
**Fix**: Should be `Vite`, not `Other` or blank

### 9. Test Locally First

Before deploying, test the build locally:

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage/web-app"
npm run build
npm run preview
```

If this works locally, the issue is Vercel configuration.

### 10. Last Resort: Delete and Re-import Project

If nothing works:

1. Delete the Vercel project
2. Go to **Add New Project**
3. Import from GitHub: `liquidgolf-cmd/car_mileage`
4. **IMPORTANT**: During import, set:
   - Root Directory: `web-app`
   - Framework Preset: `Vite`
5. Deploy

## Still Getting 404?

Share these details:
1. What's in the **Build Logs**? (copy/paste last 20 lines)
2. What are your exact **Build and Deployment** settings?
3. What URL are you visiting? (the full URL)
4. Is the deployment showing as **Success** (green checkmark)?


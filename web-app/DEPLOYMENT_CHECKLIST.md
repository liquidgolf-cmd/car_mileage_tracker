# Deployment Checklist - If Root Directory is Already Set

## ✅ Root Directory is Set to "web-app" - Good!

Since Root Directory is already configured, let's check other potential issues:

## Step 1: Verify Build Settings

In Vercel Dashboard → Settings → **Build and Deployment**, verify:

- ✅ **Root Directory**: `web-app` (you have this!)
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Step 2: Check Build Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check the **Build Logs** - look for errors

Common issues:
- ❌ Build command failing
- ❌ Missing dependencies
- ❌ TypeScript errors
- ❌ Missing files

## Step 3: Verify Project Structure

Make sure your repository has:
```
your-repo/
├── web-app/           ← Root Directory points here
│   ├── package.json   ← Must exist!
│   ├── src/
│   ├── vite.config.ts
│   └── ...
└── other folders...
```

## Step 4: Check Git Connection

1. Settings → **Git**
2. Verify repository is connected
3. Check which branch is deployed (should be `main` or `master`)

## Step 5: Common Issues & Fixes

### Issue: Build fails with "Cannot find module"
**Fix**: Make sure `web-app/package.json` exists and has all dependencies

### Issue: "Build command not found"
**Fix**: Set Build Command to: `npm run build`

### Issue: "Output directory not found"
**Fix**: Set Output Directory to: `dist`

### Issue: Deployment succeeds but app doesn't load
**Fix**: Check if `vercel.json` rewrites are correct (should redirect to `/index.html`)

## Step 6: Try a Fresh Deployment

1. **Redeploy**:
   - Deployments tab → Latest deployment → "..." menu → **Redeploy**

2. **Or trigger new deployment**:
   - Make a small change (like adding a space to README.md)
   - Commit and push to GitHub
   - Vercel will auto-deploy

## Step 7: Check Environment

If you're using environment variables:
1. Settings → **Environment Variables**
2. Make sure all required variables are set
3. Redeploy after adding variables

## Quick Test Commands

Test locally first:

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage/web-app"
npm install
npm run build
```

If this works locally, Vercel should work too!

## Still Having Issues?

Share the error message from:
1. Build logs in Vercel
2. Or the specific error you're seeing

Common error messages:
- "Build Command failed" → Check build command
- "Module not found" → Check dependencies
- "Port already in use" → Not an issue on Vercel
- "Path not found" → Check Root Directory path


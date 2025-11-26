# Where to Find Root Directory in Vercel

## Location

**Root Directory is NOT in "General" settings.**

It's in **"Build and Deployment"** settings.

## Step-by-Step Instructions

1. **You're currently on**: Settings → General ✅
   
2. **Look at the LEFT SIDEBAR** - you should see:
   - General (selected)
   - **Build and Deployment** ← Click this one!
   - Domains
   - Environments
   - etc.

3. **Click "Build and Deployment"** in the left sidebar

4. **Scroll down** - you'll find:
   - Build Command
   - Output Directory
   - Install Command
   - **Root Directory** ← This is what you need!

5. **Set Root Directory**:
   - Click "Edit" next to Root Directory
   - Select "Set to different directory"
   - Enter: `web-app`
   - Click "Save"

6. **After saving**, go to Deployments tab and redeploy

## Quick Visual Guide

```
Settings
├── General (you are here)
├── Build and Deployment ← GO HERE for Root Directory
│   ├── Framework Preset
│   ├── Build Command
│   ├── Output Directory
│   ├── Install Command
│   └── Root Directory ← Set to "web-app"
├── Domains
└── ...
```

## Alternative: Set During Import

If you haven't deployed yet, you can set it during the import process:
- When importing the project, look for "Root Directory" option
- Set it to `web-app` before clicking Deploy


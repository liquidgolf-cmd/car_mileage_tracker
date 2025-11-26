# GitHub Setup & Deployment Guide

## ✅ Git Repository Initialized!

Your local repository is ready. Follow these steps to push to GitHub and deploy to Vercel.

---

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `car-mileage-tracker` (or your choice)
3. **Description**: "Mileage tracking app for freelancers - iOS and Web MVP"
4. **Visibility**: Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

---

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage"

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/car-mileage-tracker.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Or if you prefer SSH:**

```bash
git remote add origin git@github.com:YOUR_USERNAME/car-mileage-tracker.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Import via Vercel Dashboard (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository (`car-mileage-tracker`)
4. Configure project:
   - **Framework Preset**: `Vite` (auto-detected)
   - **Root Directory**: `web-app` ⚠️ **IMPORTANT: Set this!**
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
5. Click **"Deploy"**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Navigate to web-app directory
cd "/Users/michaelhill/Documents/GitHub/car mileage/web-app"

# Link to GitHub repo
vercel link

# Deploy
vercel --prod
```

---

## Step 4: Configure Root Directory in Vercel

**IMPORTANT:** Since your web app is in the `web-app` folder, you need to tell Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Find **"Root Directory"**
3. Click **"Edit"**
4. Set to: `web-app`
5. Save

Or set it during import:
- In the import screen, click **"Root Directory"** → Select `web-app`

---

## Step 5: Automatic Deployments

Once set up:
- ✅ Every push to `main` branch = automatic production deployment
- ✅ Every pull request = preview deployment
- ✅ No manual deployment needed!

---

## Quick Command Reference

```bash
# After making changes locally
cd "/Users/michaelhill/Documents/GitHub/car mileage"
git add .
git commit -m "Your commit message"
git push

# Vercel will automatically deploy!
```

---

## Repository Structure

```
car-mileage-tracker/
├── CarMileage/          # iOS app (Xcode project)
├── web-app/            # Web app (React + Vite) ← Vercel deploys this
├── PROJECT OVERVIEW.txt
├── README.md
└── ...
```

---

## Troubleshooting

### "Root Directory" Error?
- Make sure Root Directory is set to `web-app` in Vercel settings

### Build Fails?
- Check build logs in Vercel dashboard
- Verify `web-app/package.json` exists
- Make sure build command is `npm run build`

### Can't Push to GitHub?
- Check your GitHub username in the remote URL
- Make sure you're authenticated (use `gh auth login` or GitHub Desktop)
- Try using GitHub Desktop app for easier Git operations

---

## Next Steps After Deployment

1. ✅ Test your live app at the Vercel URL
2. ✅ Set up custom domain (optional)
3. ✅ Configure environment variables if needed
4. ✅ Start making updates and watch them auto-deploy!

---

## Need Help?

- [GitHub Documentation](https://docs.github.com)
- [Vercel Documentation](https://vercel.com/docs)
- Check `web-app/VERCEL_DEPLOY.md` for more details


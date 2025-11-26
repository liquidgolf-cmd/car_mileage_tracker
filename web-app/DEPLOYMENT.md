# Deployment to Vercel - Step by Step Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier is fine)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Option 1: Deploy via Vercel CLI (Recommended for first-time setup)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open a browser window for you to authenticate.

### Step 3: Navigate to Project Directory

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage/web-app"
```

### Step 4: Deploy to Vercel

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (for first deployment)
- **What's your project's name?** → `car-mileage-tracker` (or your choice)
- **In which directory is your code located?** → `./` (current directory)

### Step 5: Production Deployment

After the preview deployment succeeds, deploy to production:

```bash
vercel --prod
```

### Step 6: View Your App

Vercel will provide you with:
- **Preview URL**: For testing deployments
- **Production URL**: Your live app (e.g., `https://car-mileage-tracker.vercel.app`)

---

## Option 2: Deploy via Vercel Dashboard (Git Integration)

### Step 1: Push Code to GitHub

If you haven't already, initialize git and push to GitHub:

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage"
git init
git add .
git commit -m "Initial commit - Mileage tracker web app"
```

Then push to GitHub (create a new repository on GitHub first if needed):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `web-app` (if your repo has multiple folders)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

### Step 3: Deploy

Click **"Deploy"** button. Vercel will:
- Install dependencies
- Build your app
- Deploy to production

### Step 4: View Your Live App

Once deployment completes, you'll see your live URL in the dashboard!

---

## Environment Variables (If Needed Later)

If you need to add environment variables in the future:

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add any variables you need
4. Redeploy for changes to take effect

## Custom Domain (Optional)

To add a custom domain:

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Domains**
3. Add your domain name
4. Follow DNS configuration instructions

## Automatic Deployments

Once connected to Git:
- **Every push to `main` branch** → Deploys to production automatically
- **Every pull request** → Creates preview deployment
- **No manual deployment needed!**

## Troubleshooting

### Build Fails

- Check the build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Verify build command works locally: `npm run build`

### Routing Issues

- The `vercel.json` file handles React Router routing
- All routes redirect to `index.html` for client-side routing

### Location Services Not Working

- Location services require HTTPS (Vercel provides this automatically)
- Make sure your browser allows location permissions
- Test on mobile devices for real GPS tracking

## Updating Your App

### Via Git (Automatic)

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Vercel automatically deploys!

### Via CLI (Manual)

```bash
cd "/Users/michaelhill/Documents/GitHub/car mileage/web-app"
vercel --prod
```

## Project Configuration Summary

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Node Version**: Auto-detected (18+)

Your app is ready to deploy! 🚀


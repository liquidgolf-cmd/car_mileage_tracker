# Fix: Deployments Going to Wrong URL

## The Problem

Deployments are going to: `https://car-mileage-delta.vercel.app/`
But you want: `https://car-mileage-seven.vercel.app/`

This means your GitHub repository is connected to the **wrong Vercel project**.

## Solution: Reconnect GitHub to Correct Project

### Option 1: Connect GitHub to `car-mileage-seven` (Recommended)

1. **Go to the correct project:**
   https://vercel.com/mike-hills-projects-d31a9ef5/car-mileage-seven/settings/git

2. **Disconnect current connection** (if any):
   - Scroll down to "Git Repository"
   - Click "..." menu
   - Click "Disconnect"

3. **Connect your GitHub repo:**
   - Click "Connect Git Repository"
   - Select: `liquidgolf-cmd/car_mileage`
   - Set Production Branch: `main`
   - Set Root Directory: `web-app`
   - Click "Connect"

4. **Verify settings:**
   - Production Branch: `main` ✅
   - Root Directory: `web-app` ✅

5. **Push to trigger deployment:**
   ```bash
   cd "/Users/michaelhill/Documents/GitHub/car mileage"
   git commit --allow-empty -m "Trigger deployment to correct project"
   git push origin main
   ```

---

### Option 2: Disconnect Wrong Project

If `car-mileage-delta` shouldn't be connected:

1. **Go to wrong project:**
   https://vercel.com/mike-hills-projects-d31a9ef5/car-mileage-delta/settings/git

2. **Disconnect GitHub:**
   - Scroll to "Git Repository"
   - Click "..." menu
   - Click "Disconnect"

3. **Then follow Option 1** to connect to `car-mileage-seven`

---

### Option 3: Use the Correct Project URL

If you want to keep both projects but use the correct one:

**Make sure your deployments go to:**
- ✅ `car-mileage-seven` (correct)
- ❌ `car-mileage-delta` (disconnect this one)

---

## Verify Which Project is Connected

To check which project your repo is connected to:

1. Go to: https://github.com/liquidgolf-cmd/car_mileage/settings/hooks
2. Look for Vercel webhooks
3. Check which project URL they point to

---

## Quick Checklist

- [ ] Go to `car-mileage-seven` Git settings
- [ ] Verify/connect GitHub repo: `liquidgolf-cmd/car_mileage`
- [ ] Set Production Branch: `main`
- [ ] Set Root Directory: `web-app`
- [ ] Disconnect `car-mileage-delta` if not needed
- [ ] Push to main to trigger deployment
- [ ] Verify deployment goes to `car-mileage-seven.vercel.app`

---

## After Fixing

Once connected correctly:
- Pushes to `main` will deploy to: `https://car-mileage-seven.vercel.app`
- All future deployments will go to the correct project
- Old `car-mileage-delta` deployments will stop (if disconnected)

---

## Need Help?

If you're unsure which project to use:
- Check your Vercel dashboard for recent deployments
- Look at which project has the most recent activity
- `car-mileage-seven` appears to be the main project you've been using


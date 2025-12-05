# Auto-Tracking Debug Steps

## Quick Checklist

### 1. Is Auto-Tracking Enabled?
- [ ] Go to Settings
- [ ] Check "Auto-Tracking" toggle is ON
- [ ] If OFF, turn it ON

### 2. Is Location Permission Granted?
- [ ] Browser asked for location permission
- [ ] You clicked "Allow"
- [ ] Check browser settings if unsure

### 3. Is the App Open?
- [ ] App tab is open and visible
- [ ] Not minimized or in background
- **Note:** Web apps CANNOT track when closed!

### 4. Are You Moving Fast Enough?
- [ ] Driving at least 10 mph
- [ ] Maintained for 30+ seconds
- [ ] Current speed shows in auto-tracking status

---

## Check Console Logs

1. Open browser developer tools:
   - Mac: `Cmd + Option + I`
   - Windows: `F12` or `Ctrl + Shift + I`

2. Click "Console" tab

3. Look for messages starting with `[Auto-Tracking]`:
   - ✅ `Starting location monitoring...` - Working!
   - ✅ `Detected movement at X mph` - Speed detected!
   - ✅ `X seconds until trip starts` - Countdown active!
   - ✅ `Starting trip` - SUCCESS!
   - ❌ `Location error: Permission denied` - Fix permissions
   - ❌ `Location error: Position unavailable` - GPS signal weak

---

## Common Problems

### Problem: Auto-tracking shows "Monitoring" but never starts

**Reasons:**
1. Not driving fast enough (need 10 mph for 30 seconds)
2. App tab closed/backgrounded (web apps can't track in background)
3. Speed drops below 10 mph before 30 seconds

**Solution:**
- Keep app open and visible
- Drive at consistent 10+ mph
- Wait full 30 seconds
- Check console for speed messages

---

### Problem: Auto-tracking doesn't show at all

**Reasons:**
1. Auto-tracking not enabled in Settings
2. Location permission not granted
3. Browser doesn't support geolocation

**Solution:**
- Go to Settings → Enable Auto-Tracking
- Grant location permission when prompted
- Use modern browser (Chrome, Safari, Firefox)

---

### Problem: Permission error

**Reasons:**
1. Browser permission denied
2. System Location Services disabled (Mac)
3. Site-specific permission blocked

**Solution:**
- Browser: Settings → Privacy → Location → Allow
- Mac: System Settings → Privacy & Security → Location Services → Enable
- Click lock icon in address bar → Allow location

---

## Test Steps

### Step 1: Verify Location Works
1. Click "Start Trip" manually
2. If it works → location is fine
3. If not → fix location permission first

### Step 2: Enable Auto-Tracking
1. Go to Settings
2. Toggle Auto-Tracking ON
3. Grant permission if prompted

### Step 3: Test Auto-Start
1. Keep app open
2. Drive at 10+ mph
3. Maintain speed for 30+ seconds
4. Trip should start automatically

### Step 4: Check Console
1. Open developer tools
2. Look for `[Auto-Tracking]` messages
3. Should see speed detection and countdown

---

## What to Look For

### In the App:
- Auto-tracking status card shows "Monitoring" or "Active"
- Speed displayed if moving
- Trip starts automatically after 30 seconds at 10+ mph

### In Console:
- `[Auto-Tracking] Starting location monitoring...`
- `[Auto-Tracking] Detected movement at X mph`
- `[Auto-Tracking] Moving at X mph - Y seconds until trip starts`
- `[Auto-Tracking] Starting trip`

---

## Key Requirements

✅ Auto-tracking enabled in Settings  
✅ Location permission granted  
✅ App open and visible (web apps can't run in background)  
✅ Driving at 10+ mph consistently  
✅ Maintain speed for 30+ seconds  
✅ GPS signal available  

---

## Still Not Working?

1. Check console for error messages
2. Verify all requirements above
3. Try toggling auto-tracking OFF then ON
4. Test manual trip to verify location works
5. Try different browser

Remember: **Web apps cannot track in the background!** The app must be open and visible.


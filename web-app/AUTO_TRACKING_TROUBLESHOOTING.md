# Auto-Tracking Troubleshooting Guide

## Why Auto-Tracking Might Not Be Working

### 1. **Web App Limitations**

**Important:** Web apps CANNOT track location when:
- ❌ Browser tab is closed
- ❌ App is in background (some browsers)
- ❌ Browser is minimized (some browsers)

**Solution:** Keep the app open and visible while driving.

---

### 2. **Location Permission Issues**

**Check:**
- Browser location permission granted
- System Location Services enabled (Mac: System Settings → Privacy & Security → Location Services)
- Site-specific permission granted (click lock icon in address bar)

**Fix:**
1. Go to Settings in the app
2. Turn auto-tracking OFF, then ON again
3. Grant permission when prompted
4. Check browser settings if permission prompt doesn't appear

---

### 3. **Speed Threshold Too High**

**Current requirement:**
- Must drive at **10 mph for 30 seconds** to start a trip

**Why this might not work:**
- Slow starts from parking lots
- Heavy traffic
- Stop-and-go conditions

**Solution:**
- The app will start tracking once you reach 10 mph and maintain it for 30 seconds
- Keep the app open and wait for the trip to start automatically

---

### 4. **GPS Signal Issues**

**Symptoms:**
- Auto-tracking enabled but no location updates
- "Location unavailable" errors

**Fix:**
- Move to an area with better GPS signal
- Open area (not in tunnels, parking garages, etc.)
- Wait a few seconds for GPS to lock on

---

### 5. **Auto-Tracking Not Enabled**

**Check:**
1. Open the app
2. Go to Settings
3. Look for "Auto-Tracking" toggle
4. Make sure it's set to "ON"

---

## Diagnostic Steps

### Step 1: Check if Auto-Tracking is Enabled

1. Open the app
2. Go to Settings
3. Verify "Auto-Tracking" shows "ON"

### Step 2: Check Location Permission

1. Open browser settings
2. Find location/permissions settings
3. Verify the app has location access
4. On Mac: Check System Settings → Privacy & Security → Location Services

### Step 3: Test Location Access

1. Click "Start Trip" manually
2. If it works, location permission is fine
3. If not, fix permission issues first

### Step 4: Keep App Open

1. Enable auto-tracking
2. Keep the app open (don't close the tab)
3. Drive at 10+ mph for 30+ seconds
4. Trip should start automatically

### Step 5: Check Browser Console

1. Open browser developer tools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for `[Auto-Tracking]` messages
4. These show what's happening:
   - `Starting location monitoring...` - Monitoring started
   - `Detected movement at X mph` - Speed detected
   - `X seconds until trip starts` - Countdown to trip start
   - `Starting trip` - Trip started successfully

---

## Common Issues & Solutions

### Issue: "Auto-Tracking Monitoring" but trip never starts

**Possible causes:**
1. Not driving fast enough (need 10 mph for 30 seconds)
2. App tab closed or backgrounded
3. GPS signal weak

**Solution:**
- Keep app open and visible
- Drive at 10+ mph consistently
- Wait 30+ seconds
- Check console for `[Auto-Tracking]` messages

---

### Issue: Auto-tracking enabled but no status shown

**Possible causes:**
1. Permission not granted
2. Location services disabled
3. Browser doesn't support geolocation

**Solution:**
- Go to Settings, toggle auto-tracking OFF then ON
- Grant permission when prompted
- Use a modern browser (Chrome, Safari, Firefox, Edge)

---

### Issue: Trip starts then stops immediately

**Possible causes:**
1. Speed drops below 3 mph for 5+ minutes
2. GPS signal lost
3. Location permission revoked

**Solution:**
- Keep moving - trip continues if speed >= 3 mph
- Check GPS signal
- Verify location permission still granted

---

## Console Messages Explained

| Message | Meaning |
|---------|---------|
| `[Auto-Tracking] Starting location monitoring...` | Monitoring initialized |
| `[Auto-Tracking] Monitoring started successfully` | Ready to detect driving |
| `[Auto-Tracking] Detected movement at X mph` | Speed detected, timer started |
| `[Auto-Tracking] Moving at X mph - Y seconds until trip starts` | Countdown to trip start |
| `[Auto-Tracking] Starting trip` | Trip started successfully! |
| `[Auto-Tracking] Location error: Permission denied` | Fix location permission |
| `[Auto-Tracking] Location error: Position unavailable` | GPS signal weak |

---

## Best Practices

1. **Keep app open** - Web apps can't track in background
2. **Grant location permission** - Required for auto-tracking
3. **Drive consistently** - 10+ mph for 30+ seconds to start
4. **Check console** - Look for `[Auto-Tracking]` messages to debug
5. **Be patient** - It takes 30 seconds of consistent speed to start

---

## Still Not Working?

1. **Check console logs** - Look for `[Auto-Tracking]` messages
2. **Try manual trip** - Click "Start Trip" to verify location works
3. **Restart auto-tracking** - Toggle OFF then ON in Settings
4. **Check permissions** - Verify browser and system location settings
5. **Use different browser** - Try Chrome, Safari, or Firefox

---

## Known Limitations

- **Web apps cannot track in background** - App must be open
- **Requires consistent speed** - 10 mph for 30 seconds to start
- **GPS dependent** - Weak signal may prevent tracking
- **Browser dependent** - Some browsers have better location support

These limitations are inherent to web apps. For true background tracking, a native mobile app would be needed.


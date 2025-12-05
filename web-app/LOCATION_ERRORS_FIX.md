# Fix Location Errors (CoreLocation)

## The Problem

You're seeing errors like:
```
CoreLocationProvider: CoreLocation framework reported a kCLErrorLocationUnknown failure.
```

These are **browser location errors**, not code errors. They happen when:
- Location permissions aren't granted
- GPS/location services are disabled
- Browser can't determine your location
- Using Safari on Mac (which uses CoreLocation framework)

---

## Solutions

### Solution 1: Grant Location Permissions

1. **In Browser:**
   - Click the lock icon in the address bar
   - Allow location access
   - Refresh the page

2. **On Mac (Safari):**
   - System Settings → Privacy & Security → Location Services
   - Enable Location Services
   - Allow Safari to use location

3. **On iPhone/iPad:**
   - Settings → Privacy → Location Services
   - Enable Location Services
   - Allow Safari to use location

### Solution 2: Use HTTPS

Location services **require HTTPS** (except localhost).

- ✅ Vercel deployment = HTTPS (automatic)
- ✅ Your production URL = HTTPS
- ✅ Location should work on deployed site

### Solution 3: Check Browser Settings

**Safari:**
- Safari → Settings → Privacy
- Enable "Location Services"
- Check "Ask websites not to track" isn't blocking

**Chrome:**
- Settings → Privacy and security → Site settings
- Location → Allow
- Check site-specific permissions

---

## Error Handling Improvements

I'll add better error handling so these errors:
- Don't show in console (they're harmless)
- Show user-friendly messages instead
- Handle gracefully when location unavailable

---

## Common Causes

| Issue | Solution |
|-------|----------|
| Permissions denied | Allow location access in browser |
| Location Services disabled | Enable in System Settings |
| Not HTTPS | Use production URL (HTTPS) |
| GPS unavailable | Wait for GPS signal or use WiFi location |
| Browser blocking | Check privacy settings |

---

## Testing Location

1. **Grant permissions** when browser asks
2. **Allow location** in browser settings
3. **Test on production URL** (HTTPS required)
4. **Check system location services** are enabled

---

## Quick Fix Checklist

- [ ] Browser location permission granted
- [ ] System Location Services enabled (Mac/iOS)
- [ ] Testing on HTTPS URL (not HTTP)
- [ ] Browser privacy settings allow location
- [ ] GPS/Location hardware available

---

These errors won't break the app - they just mean location isn't available. The app will handle them gracefully.


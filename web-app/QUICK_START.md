# Quick Start Guide

## Run the Web App

1. **Navigate to the web-app directory:**
   ```bash
   cd web-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - The app will automatically open at `http://localhost:5173`
   - Or manually navigate to that URL
   - Note: If port 5173 is taken, Vite will use the next available port (check terminal output)

## Testing Features

### Test Trip Tracking

1. Click "Start Trip" on the home page
2. Allow location permissions when prompted
3. The app will track your location in real-time
4. Watch the distance and duration update
5. Select a category and add optional notes
6. Click "End Trip" when done
7. Confirm to save the trip

### Test Trip Management

1. Navigate to "Trips" tab
2. View all saved trips
3. Click on a trip to view/edit details
4. Try editing category or notes
5. Delete a trip to test deletion

### Test PDF Reports

1. Navigate to "Reports" tab
2. Select a report period (Month, Quarter, Year, or Custom)
3. Optionally filter by category
4. View totals (trips, miles, deduction)
5. Click "Generate PDF Report"
6. PDF will download automatically

### Test Settings

1. Navigate to "Settings" tab
2. Change default trip category
3. Edit mileage rate
4. Try premium subscription (simulated)
5. View app version

## Important Notes

- **Location Services**: The app requires location permissions to track trips. Make sure your browser has location access enabled.

- **HTTPS Required**: For production, location services require HTTPS. For local development, `localhost` is allowed.

- **Data Storage**: All data is stored in your browser's localStorage. Clearing browser data will delete all trips.

- **Premium Subscription**: For MVP testing, premium is simulated via localStorage. In production, this would connect to a payment provider.

## Troubleshooting

**Location not working?**
- Check browser permissions for location access
- Make sure you're using HTTPS or localhost
- Try refreshing the page and allowing permissions again

**PDF not generating?**
- Make sure you have trips saved for the selected period
- Check browser console for errors

**App not loading?**
- Run `npm install` to ensure all dependencies are installed
- Check that port 5173 is not in use (or use the port shown in terminal)
- Try `npm run dev` again

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Next Steps

- Test all features thoroughly
- Customize the styling if needed
- Add more features as needed
- Deploy to a hosting service when ready


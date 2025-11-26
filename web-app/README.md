# Car Mileage Tracker - Web App

A minimalist web-based mileage tracking app for freelancers and self-employed individuals.

## Features

- **One-tap trip start/stop** - Manual tracking with GPS
- **Trip categorization** - Business, Personal, Medical, Charity
- **IRS-compliant mileage rates** - $0.67/mile default (2025), customizable
- **PDF report generation** - Professional "Business Expense Mileage Report"
- **Local storage** - All data stored in browser localStorage
- **Freemium model** - 40 trips/month free, unlimited with premium
- **Manual trip editing** - Add or edit trips you forgot to track

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5174
```

### Deploy to Vercel

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed deployment instructions.

**Quick deploy:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **jsPDF** - PDF generation
- **date-fns** - Date utilities
- **Geolocation API** - GPS tracking

## Browser Requirements

- Modern browser with Geolocation API support
- HTTPS required for location services (or localhost for development)

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Quick Vercel deployment guide
- [QUICK_START.md](./QUICK_START.md) - Testing and usage guide
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details

## Features Implementation Details

### Trip Tracking
- Start/stop tracking with GPS
- Real-time distance calculation
- Category selection (Business, Personal, Medical, Charity)
- Optional notes field

### Trip Management
- View all trips in a list
- Edit trip details (dates, locations, distance, category, notes)
- Delete trips
- Add trips manually

### Reports
- Generate PDF reports
- Filter by date range (Month, Quarter, Year, Custom)
- Filter by category
- Total miles and deduction calculations

### Settings
- Default category selection
- Custom mileage rate override
- Subscription management

## Data Storage

All data is stored locally in the browser's localStorage. No data is sent to external servers.

## Notes

- Location permissions are required for trip tracking
- The app uses OpenStreetMap's Nominatim API for reverse geocoding (free tier)
- Premium subscription is simulated via localStorage (for MVP testing)

## License

Private project

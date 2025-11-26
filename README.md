# Car Mileage Tracking App - iOS MVP

A minimalist iOS mileage tracking app for freelancers and self-employed individuals.

## Features

### MVP (v1.0)

- **One-tap trip start/stop** - Manual tracking with GPS
- **Trip categorization** - Business, Personal, Medical, Charity
- **IRS-compliant mileage rates** - 2025 rate pre-loaded ($0.67/mile), customizable
- **PDF report generation** - Professional "Business Expense Mileage Report"
- **Local device storage** - Core Data for persistence
- **Clean, minimalist UI** - Professional and friendly design
- **Freemium model** - 40 trips/month free, unlimited with premium subscription

## Project Structure

```
CarMileage/
├── CarMileage/
│   ├── App/
│   │   └── CarMileageApp.swift
│   ├── Models/
│   │   ├── Trip+CoreDataClass.swift
│   │   ├── Trip+CoreDataProperties.swift
│   │   ├── TripCategory.swift
│   │   └── MileageRate.swift
│   ├── Views/
│   │   ├── ContentView.swift
│   │   ├── HomeView.swift
│   │   ├── ActiveTripView.swift
│   │   ├── TripListView.swift
│   │   ├── TripDetailView.swift
│   │   ├── ReportsView.swift
│   │   ├── SettingsView.swift
│   │   └── SubscriptionView.swift
│   ├── ViewModels/
│   │   ├── TripTrackerViewModel.swift
│   │   └── ReportsViewModel.swift
│   ├── Services/
│   │   ├── LocationService.swift
│   │   ├── CoreDataService.swift
│   │   ├── PDFReportService.swift
│   │   └── SubscriptionService.swift
│   ├── Utilities/
│   │   └── Extensions.swift
│   └── Resources/
│       ├── CarMileage.xcdatamodeld
│       └── Info.plist
```

## Setup Instructions

### Prerequisites

- Xcode 15.0 or later
- iOS 17.0+ deployment target
- Apple Developer account (for testing on device and App Store submission)

### Steps

1. Open the project in Xcode
2. Select your development team in project settings
3. Configure App Store Connect for In-App Purchases (SubscriptionService uses product ID: `com.carmileage.premium.monthly`)
4. Build and run on simulator or device

### Location Permissions

The app requires location permissions. Make sure Info.plist includes:
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`

### Core Data Model

The Core Data model is defined in `CarMileage.xcdatamodeld`. Make sure it's properly loaded in `CoreDataService`.

## Configuration

### Subscription Setup

To enable subscriptions:
1. Create subscription product in App Store Connect with ID: `com.carmileage.premium.monthly`
2. Set pricing ($4.99-$9.99/month recommended)
3. The app will automatically handle subscription verification

### Custom Mileage Rate

Users can override the default IRS rate in Settings. Default is $0.67/mile for 2025.

## Development Notes

- Uses SwiftUI for modern declarative UI
- Core Data for local persistence
- StoreKit 2 for subscriptions
- CoreLocation for GPS tracking
- PDFKit for report generation

## Future Enhancements (Post-MVP)

- Automatic trip detection
- Cloud sync/backup
- Photo receipt attachment
- Calendar integration
- Favorite locations
- Monthly notifications


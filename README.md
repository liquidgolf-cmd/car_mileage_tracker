# Car Mileage Tracker

A minimalist mileage tracking app for freelancers and self-employed individuals. Available as both an iOS app and a web app.

## 📱 Project Structure

This repository contains two versions of the mileage tracking app:

- **iOS App** (`CarMileage/`) - Native iOS app built with SwiftUI
- **Web App** (`web-app/`) - React + TypeScript web application

Both apps share the same core features and design principles.

## ✨ Features

- **One-tap trip tracking** - Start/stop tracking with GPS
- **Trip categorization** - Business, Personal, Medical, Charity
- **IRS-compliant mileage rates** - $0.67/mile default (2025), customizable
- **PDF report generation** - Professional "Business Expense Mileage Report"
- **Manual trip editing** - Add or edit trips you forgot to track
- **Freemium model** - 40 trips/month free, unlimited with premium

## 🚀 Quick Start

### Web App (Ready to Deploy)

The web app is ready to deploy to Vercel. See:
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - GitHub & Vercel deployment guide
- [web-app/VERCEL_DEPLOY.md](./web-app/VERCEL_DEPLOY.md) - Detailed deployment steps

### iOS App

The iOS app requires Xcode. See:
- [CarMileage/README.md](./CarMileage/README.md) - iOS setup instructions
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation details

## 📖 Documentation

- [PROJECT OVERVIEW.txt](./PROJECT%20OVERVIEW.txt) - Original project requirements
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - GitHub repository setup guide

## 🔧 Tech Stack

### Web App
- React 18 + TypeScript
- Vite
- React Router
- jsPDF for reports
- Geolocation API

### iOS App
- SwiftUI
- Core Data
- CoreLocation
- PDFKit
- StoreKit 2

## 📝 License

Private project

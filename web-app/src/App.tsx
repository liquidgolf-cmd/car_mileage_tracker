import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ActiveTripService } from './services/ActiveTripService';
import { AutoTrackingService } from './services/AutoTrackingService';
import { locationService } from './services/LocationService';
import HomeView from './views/HomeView';
import TripListView from './views/TripListView';
import ExpenseListView from './views/ExpenseListView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import TripCategorizationView from './views/TripCategorizationView';
import ReceiptListView from './views/ReceiptListView';
import ReceiptDetailView from './views/ReceiptDetailView';
import './App.css';

function App() {
  useEffect(() => {
    // Ensure timer keeps running for active trip across navigation
    const activeTrip = ActiveTripService.getActiveTrip();
    
    if (activeTrip) {
      // Start timer if there's an active trip
      ActiveTripService.startTimer(() => {
        ActiveTripService.updateDuration();
      });
    }

    // Subscribe to active trip changes
    const unsubscribeTrip = ActiveTripService.subscribe((tripData) => {
      if (tripData) {
        // Start timer when trip becomes active
        ActiveTripService.startTimer(() => {
          ActiveTripService.updateDuration();
        });
      } else {
        // Stop timer when trip ends
        ActiveTripService.stopTimer();
      }
    });

    // Initialize auto-tracking if enabled
    const wasAutoTrackingEnabled = AutoTrackingService.loadPreference();
    if (wasAutoTrackingEnabled) {
      locationService.requestPermission().then((granted) => {
        if (granted) {
          AutoTrackingService.enableAutoTracking();
        }
      });
    }

    return () => {
      unsubscribeTrip();
      // Don't stop timer here - let it run until trip ends
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/trips" element={<TripListView />} />
          <Route path="/expenses" element={<ExpenseListView />} />
          <Route path="/reports" element={<ReportsView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/trip-categorization" element={<TripCategorizationView />} />
          <Route path="/receipts" element={<ReceiptListView />} />
          <Route path="/receipts/:id" element={<ReceiptDetailView />} />
        </Routes>
        
        <nav className="bottom-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📍</span>
            <span>Track</span>
          </NavLink>
          <NavLink to="/trips" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📋</span>
            <span>Trips</span>
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">💰</span>
            <span>Expenses</span>
          </NavLink>
          <NavLink to="/receipts" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📷</span>
            <span>Receipts</span>
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📄</span>
            <span>Reports</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
}

export default App;


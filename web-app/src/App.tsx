import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { ActiveTripService } from './services/ActiveTripService';
import { AutoTrackingService } from './services/AutoTrackingService';
import { locationService } from './services/LocationService';
import { AuthService } from './services/AuthService';
import ProtectedRoute from './components/ProtectedRoute';
import LoginView from './views/LoginView';
import SignUpView from './views/SignUpView';
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
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());

  useEffect(() => {
    // Check authentication status on mount
    setIsAuthenticated(AuthService.isAuthenticated());
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

  // Check if this is first launch (no users exist)
  const isFirstLaunch = AuthService.isFirstLaunch();

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginView />
          } />
          <Route path="/signup" element={
            isAuthenticated ? <Navigate to="/" replace /> : <SignUpView />
          } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomeView />
            </ProtectedRoute>
          } />
          <Route path="/trips" element={
            <ProtectedRoute>
              <TripListView />
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <ExpenseListView />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportsView />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsView />
            </ProtectedRoute>
          } />
          <Route path="/trip-categorization" element={
            <ProtectedRoute>
              <TripCategorizationView />
            </ProtectedRoute>
          } />
          <Route path="/receipts" element={
            <ProtectedRoute>
              <ReceiptListView />
            </ProtectedRoute>
          } />
          <Route path="/receipts/:id" element={
            <ProtectedRoute>
              <ReceiptDetailView />
            </ProtectedRoute>
          } />
          
          {/* Catch-all: redirect based on auth status */}
          <Route path="*" element={
            isFirstLaunch && !isAuthenticated ? <Navigate to="/signup" replace /> :
            !isAuthenticated ? <Navigate to="/login" replace /> :
            <Navigate to="/" replace />
          } />
        </Routes>
        
        {/* Only show navigation if authenticated */}
        {isAuthenticated && (
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
        )}
      </div>
    </Router>
  );
}

export default App;


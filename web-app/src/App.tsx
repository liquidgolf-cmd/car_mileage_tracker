import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ActiveTripService } from './services/ActiveTripService';
import HomeView from './views/HomeView';
import TripListView from './views/TripListView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
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
    const unsubscribe = ActiveTripService.subscribe((tripData) => {
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

    return () => {
      unsubscribe();
      // Don't stop timer here - let it run until trip ends
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/trips" element={<TripListView />} />
          <Route path="/reports" element={<ReportsView />} />
          <Route path="/settings" element={<SettingsView />} />
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


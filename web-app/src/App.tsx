import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HomeView from './views/HomeView';
import TripListView from './views/TripListView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import './App.css';

function App() {
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


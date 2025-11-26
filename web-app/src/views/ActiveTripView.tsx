import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationService } from '../services/LocationService';
import { ActiveTripService } from '../services/ActiveTripService';

interface ActiveTripViewProps {
  onTripEnded: () => void;
}

function ActiveTripView({ onTripEnded }: ActiveTripViewProps) {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState(ActiveTripService.getActiveTrip());

  useEffect(() => {
    // Subscribe to trip data updates
    const unsubscribe = ActiveTripService.subscribe((data) => {
      if (data) {
        setTripData(data);
        // Update duration when trip data changes
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        setDuration(elapsed);
      } else {
        setTripData(null);
      }
    });

    // Update duration periodically while component is mounted
    const intervalId = setInterval(() => {
      const data = ActiveTripService.getActiveTrip();
      if (data) {
        setTripData(data);
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        setDuration(elapsed);
      }
    }, 1000);

    // Cleanup: Don't stop tracking when component unmounts
    // Only stop when explicitly ending the trip
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  if (!tripData) {
    // No active trip - should not happen, but handle gracefully
    return null;
  }

  const handleEndTrip = async () => {
    if (!tripData.startLocation || !tripData.currentLocation) {
      setError('Missing trip data');
      return;
    }

    // Stop tracking and location updates, but keep trip data
    locationService.stopTracking();
    ActiveTripService.stopTimer();
    
    // Navigate to categorization screen with trip data
    navigate('/trip-categorization', { 
      state: { tripData } 
    });
    
    // Call onTripEnded to update parent state
    onTripEnded();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <div className="card">
        <div className="status-badge status-tracking">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger-color)' }}></span>
          Tracking
        </div>

        <div className="text-center" style={{ marginTop: '40px', marginBottom: '40px' }}>
          <div className="big-number">{formatDuration(duration)}</div>
        </div>

        <div className="text-center mb-3">
          <div className="medium-number">{tripData.distance.toFixed(2)}</div>
          <div className="text-secondary">miles</div>
        </div>

        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button className="btn btn-danger btn-full" onClick={handleEndTrip}>
          End Trip
        </button>
      </div>
    </div>
  );
}

export default ActiveTripView;

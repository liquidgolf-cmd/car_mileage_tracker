import { useState, useEffect } from 'react';
import { locationService } from '../services/LocationService';
import { ActiveTripService } from '../services/ActiveTripService';
import { StorageService } from '../services/StorageService';
import { TripCategory, Trip } from '../types';

interface ActiveTripViewProps {
  onTripEnded: () => void;
}

function ActiveTripView({ onTripEnded }: ActiveTripViewProps) {
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

  const handleCategoryChange = (category: TripCategory) => {
    ActiveTripService.updateCategory(category);
  };

  const handleNotesChange = (notes: string) => {
    ActiveTripService.updateNotes(notes);
  };

  const handleEndTrip = async () => {
    if (!tripData.startLocation || !tripData.currentLocation) {
      setError('Missing trip data');
      return;
    }

    const confirmed = window.confirm(
      `Save trip?\nDistance: ${tripData.distance.toFixed(2)} miles\nCategory: ${tripData.category}`
    );

    if (!confirmed) {
      return;
    }

    // Get end location address
    let endAddress = tripData.currentLocation.address;
    if (!endAddress) {
      endAddress = `${tripData.currentLocation.latitude.toFixed(6)}, ${tripData.currentLocation.longitude.toFixed(6)}`;
    }

    const settings = StorageService.getSettings();
    const mileageRate = settings.mileageRate || 0.67;

    const trip: Trip = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      startDate: new Date(tripData.startTime),
      endDate: new Date(),
      startLocation: tripData.startLocation.address || `${tripData.startLocation.latitude.toFixed(6)}, ${tripData.startLocation.longitude.toFixed(6)}`,
      endLocation: endAddress,
      startLatitude: tripData.startLocation.latitude,
      startLongitude: tripData.startLocation.longitude,
      endLatitude: tripData.currentLocation.latitude,
      endLongitude: tripData.currentLocation.longitude,
      distance: parseFloat(tripData.distance.toFixed(2)),
      category: tripData.category,
      notes: tripData.notes,
      mileageRate,
      totalDeduction: parseFloat((tripData.distance * mileageRate).toFixed(2))
    };

    StorageService.saveTrip(trip);
    
    // Stop tracking and clear active trip
    locationService.stopTracking();
    ActiveTripService.stopTimer();
    ActiveTripService.clearActiveTrip();
    
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

        <div className="segmented-control mb-3">
          {Object.values(TripCategory).map((cat) => (
            <button
              key={cat}
              className={tripData.category === cat ? 'active' : ''}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="form-group">
          <textarea
            className="form-textarea"
            placeholder="Notes (optional)"
            value={tripData.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={3}
          />
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

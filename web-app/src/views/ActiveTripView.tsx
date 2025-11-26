import { useState, useEffect, useRef } from 'react';
import { locationService } from '../services/LocationService';
import { StorageService } from '../services/StorageService';
import { LocationData, TripCategory, Trip } from '../types';

interface ActiveTripViewProps {
  onTripEnded: () => void;
}

function ActiveTripView({ onTripEnded }: ActiveTripViewProps) {
  const [startLocation, setStartLocation] = useState<LocationData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [category, setCategory] = useState<TripCategory>(TripCategory.Business);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    startTracking();
    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = async () => {
    try {
      const hasPermission = await locationService.requestPermission();
      if (!hasPermission) {
        setError('Location permission denied. Please enable location access.');
        return;
      }

      startTimeRef.current = new Date();
      
      // Start duration timer
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
        }
      }, 1000);

      // Start location tracking
      locationService.startTracking(
        (location) => {
          if (!startLocation) {
            setStartLocation(location);
          }
          setCurrentLocation(location);
          
          if (startLocation) {
            const dist = locationService.calculateDistance(
              startLocation.latitude,
              startLocation.longitude,
              location.latitude,
              location.longitude
            );
            setDistance(dist);
          }
        },
        (err) => {
          setError(err.message);
        }
      );

      // Load default category from settings
      const settings = StorageService.getSettings();
      if (settings.defaultCategory) {
        setCategory(settings.defaultCategory as TripCategory);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
    }
  };

  const stopTracking = () => {
    locationService.stopTracking();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleEndTrip = async () => {
    if (!startLocation || !currentLocation || !startTimeRef.current) {
      setError('Missing trip data');
      return;
    }

    const confirmed = window.confirm(
      `Save trip?\nDistance: ${distance.toFixed(2)} miles\nCategory: ${category}`
    );

    if (!confirmed) {
      stopTracking();
      onTripEnded();
      return;
    }

    // Get end location address
    let endAddress = currentLocation.address;
    if (!endAddress) {
      endAddress = `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
    }

    const settings = StorageService.getSettings();
    const mileageRate = settings.mileageRate || 0.67;

    const trip: Trip = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      startDate: startTimeRef.current,
      endDate: new Date(),
      startLocation: startLocation.address || `${startLocation.latitude.toFixed(6)}, ${startLocation.longitude.toFixed(6)}`,
      endLocation: endAddress,
      startLatitude: startLocation.latitude,
      startLongitude: startLocation.longitude,
      endLatitude: currentLocation.latitude,
      endLongitude: currentLocation.longitude,
      distance: parseFloat(distance.toFixed(2)),
      category,
      notes,
      mileageRate,
      totalDeduction: parseFloat((distance * mileageRate).toFixed(2))
    };

    StorageService.saveTrip(trip);
    stopTracking();
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
          <div className="medium-number">{distance.toFixed(2)}</div>
          <div className="text-secondary">miles</div>
        </div>

        <div className="segmented-control mb-3">
          {Object.values(TripCategory).map((cat) => (
            <button
              key={cat}
              className={category === cat ? 'active' : ''}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="form-group">
          <textarea
            className="form-textarea"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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


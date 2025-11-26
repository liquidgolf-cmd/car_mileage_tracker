import { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { Trip, TripCategory } from '../types';
import { format } from 'date-fns';
import TripDetailView from './TripDetailView';

function TripListView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = () => {
    const allTrips = StorageService.getTrips();
    setTrips(allTrips);
  };

  const handleDelete = (tripId: string) => {
    if (window.confirm('Delete this trip?')) {
      StorageService.deleteTrip(tripId);
      loadTrips();
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
      }
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Business': return 'var(--primary-color)';
      case 'Personal': return 'var(--text-secondary)';
      case 'Medical': return 'var(--danger-color)';
      case 'Charity': return '#AF52DE';
      default: return 'var(--text-secondary)';
    }
  };

  if (selectedTrip) {
    return (
      <TripDetailView
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
        onUpdate={(updated) => {
          if (trips.find(t => t.id === updated.id)) {
            // Existing trip - update it
            StorageService.updateTrip(updated);
          } else {
            // New trip - save it
            StorageService.saveTrip(updated);
          }
          loadTrips();
          setSelectedTrip(updated);
        }}
        onDelete={(id) => {
          handleDelete(id);
          setSelectedTrip(null);
        }}
      />
    );
  }

  const handleCreateTrip = () => {
    const now = new Date();
    const newTrip: Trip = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      startDate: now,
      endDate: now,
      startLocation: '',
      endLocation: '',
      startLatitude: 0,
      startLongitude: 0,
      endLatitude: 0,
      endLongitude: 0,
      distance: 0,
      category: TripCategory.Business,
      notes: '',
      mileageRate: StorageService.getSettings().mileageRate || 0.67,
      totalDeduction: 0
    };
    setSelectedTrip(newTrip);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Trip History</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Tap any trip to view and edit details
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateTrip}>
          + Add Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📍</div>
          <h3>No trips yet</h3>
          <p className="text-secondary">Start tracking your first trip or add one manually.</p>
          <button className="btn btn-primary mt-3" onClick={handleCreateTrip}>
            Add Trip Manually
          </button>
        </div>
      ) : (
        trips.map((trip) => (
          <div
            key={trip.id}
            className="trip-item"
            onClick={() => setSelectedTrip(trip)}
            style={{ position: 'relative' }}
            title="Tap to view and edit trip details"
          >
            <div className="trip-header">
              <span
                className="trip-category"
                style={{ color: getCategoryColor(trip.category) }}
              >
                {trip.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="trip-date">
                  {format(new Date(trip.startDate), 'MMM d, h:mm a')}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>✏️ Tap to edit</span>
              </div>
            </div>
            <div className="trip-locations">
              <div><strong>From:</strong> {trip.startLocation}</div>
              <div><strong>To:</strong> {trip.endLocation}</div>
            </div>
            <div className="trip-details">
              <div></div>
              <div className="trip-metrics">
                <div className="trip-distance">{trip.distance.toFixed(2)} mi</div>
                <div className="trip-amount">${trip.totalDeduction.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default TripListView;


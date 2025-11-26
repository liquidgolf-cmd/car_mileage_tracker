import { useState, useEffect } from 'react';
import { Trip, TripCategory } from '../types';
import { format } from 'date-fns';
import { StorageService } from '../services/StorageService';

interface TripDetailViewProps {
  trip: Trip;
  onClose: () => void;
  onUpdate: (trip: Trip) => void;
  onDelete: (id: string) => void;
}

function TripDetailView({ trip, onUpdate, onDelete, onClose }: TripDetailViewProps) {
  const [category, setCategory] = useState<TripCategory>(trip.category);
  const [notes, setNotes] = useState(trip.notes);
  const [startDate, setStartDate] = useState(format(new Date(trip.startDate), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(new Date(trip.startDate), "HH:mm"));
  const [endDate, setEndDate] = useState(trip.endDate ? format(new Date(trip.endDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [endTime, setEndTime] = useState(trip.endDate ? format(new Date(trip.endDate), "HH:mm") : format(new Date(), "HH:mm"));
  const [startLocation, setStartLocation] = useState(trip.startLocation);
  const [endLocation, setEndLocation] = useState(trip.endLocation);
  const [distance, setDistance] = useState(trip.distance.toString());
  const [isNewTrip, setIsNewTrip] = useState(!trip.startLocation && trip.distance === 0);

  useEffect(() => {
    // Check if this is a new trip (no location data)
    setIsNewTrip(!trip.startLocation && trip.distance === 0);
  }, [trip]);

  const handleSave = () => {
    // Combine date and time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    // Validate dates
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      alert('Please enter valid dates and times');
      return;
    }

    // Validate distance
    const distanceNum = parseFloat(distance);
    if (isNaN(distanceNum) || distanceNum < 0) {
      alert('Please enter a valid distance');
      return;
    }

    // Validate locations
    if (!startLocation.trim() || !endLocation.trim()) {
      alert('Please enter both start and end locations');
      return;
    }

    // Get mileage rate
    const settings = StorageService.getSettings();
    const mileageRate = settings.mileageRate || 0.67;

    const updatedTrip: Trip = {
      ...trip,
      startDate: startDateTime,
      endDate: endDateTime,
      startLocation: startLocation.trim(),
      endLocation: endLocation.trim(),
      distance: distanceNum,
      category,
      notes: notes.trim(),
      mileageRate,
      totalDeduction: parseFloat((distanceNum * mileageRate).toFixed(2))
    };

    onUpdate(updatedTrip);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this trip? This action cannot be undone.')) {
      onDelete(trip.id);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  // Calculate duration from editable dates
  const getDuration = (): number => {
    try {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      return Math.floor((end.getTime() - start.getTime()) / 1000);
    } catch {
      return 0;
    }
  };

  const duration = getDuration();

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Trip Details</h1>
        <button className="btn btn-outline" onClick={onClose}>Close</button>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Start Date & Time</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="time"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">End Date & Time</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="time"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          <div className="text-secondary" style={{ marginTop: '4px', fontSize: '12px' }}>
            Duration: {formatDuration(duration)}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Start Location</label>
          <input
            type="text"
            className="form-input"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            placeholder="Enter start address"
          />
        </div>

        <div className="form-group">
          <label className="form-label">End Location</label>
          <input
            type="text"
            className="form-input"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
            placeholder="Enter end address"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as TripCategory)}
          >
            {Object.values(TripCategory).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Distance (miles)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mileage Rate</label>
          <div className="text-secondary">
            ${trip.mileageRate.toFixed(2)}/mile
            <span style={{ fontSize: '12px', marginLeft: '8px' }}>
              (Change in Settings)
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Total Deduction</label>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--success-color)' }}>
            ${(parseFloat(distance || '0') * trip.mileageRate).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button className="btn btn-primary btn-full" onClick={handleSave}>
          {isNewTrip ? 'Save Trip' : 'Save Changes'}
        </button>
        {!isNewTrip && (
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default TripDetailView;


import { useState, useEffect, useRef } from 'react';
import { Trip, TripCategory, Expense, ExpenseCategory } from '../types';
import { format } from 'date-fns';
import { StorageService } from '../services/StorageService';
import { locationService } from '../services/LocationService';
import ExpenseDetailView from './ExpenseDetailView';

interface TripDetailViewProps {
  trip: Trip;
  onClose: () => void;
  onUpdate: (trip: Trip) => void;
  onDelete: (id: string) => void;
}

function TripDetailView({ trip, onUpdate, onDelete, onClose }: TripDetailViewProps) {
  const [category, setCategory] = useState<TripCategory>(trip.category);
  const [notes, setNotes] = useState(trip.notes || '');
  const [startDate, setStartDate] = useState(format(new Date(trip.startDate), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(new Date(trip.startDate), "HH:mm"));
  const [endDate, setEndDate] = useState(trip.endDate ? format(new Date(trip.endDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [endTime, setEndTime] = useState(trip.endDate ? format(new Date(trip.endDate), "HH:mm") : format(new Date(), "HH:mm"));
  const [startLocation, setStartLocation] = useState(trip.startLocation || '');
  const [endLocation, setEndLocation] = useState(trip.endLocation || '');
  const [distance, setDistance] = useState(trip.distance.toString());
  const [isNewTrip, setIsNewTrip] = useState(!trip.startLocation && trip.distance === 0);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const calculateTimeoutRef = useRef<number | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [tripExpenses, setTripExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    // Check if this is a new trip (no location data)
    setIsNewTrip(!trip.startLocation && trip.distance === 0);
    // Load expenses for this trip
    if (trip.id) {
      const expenses = StorageService.getExpensesForTrip(trip.id);
      setTripExpenses(expenses);
    }
  }, [trip]);

  // Auto-calculate distance when addresses change
  useEffect(() => {
    // Clear any pending calculation
    if (calculateTimeoutRef.current) {
      clearTimeout(calculateTimeoutRef.current);
    }

    // Only calculate if both addresses are provided and have been modified
    const trimmedStart = (startLocation || '').trim();
    const trimmedEnd = (endLocation || '').trim();

    if (!trimmedStart || !trimmedEnd) {
      return;
    }

    // Don't recalculate if addresses haven't changed from original
    if (trimmedStart === trip.startLocation && trimmedEnd === trip.endLocation) {
      return;
    }

    // Debounce: Wait 1 second after user stops typing before calculating
    setIsCalculatingDistance(true);
    calculateTimeoutRef.current = window.setTimeout(async () => {
      try {
        const calculatedDistance = await locationService.calculateDistanceFromAddresses(
          trimmedStart,
          trimmedEnd
        );

        if (calculatedDistance !== null) {
          setDistance(calculatedDistance.toFixed(2));
        } else {
          // If geocoding fails, keep the current distance (user can still edit manually)
          console.log('Could not calculate distance automatically. You can enter it manually.');
        }
      } catch (error) {
        console.error('Error calculating distance:', error);
      } finally {
        setIsCalculatingDistance(false);
      }
    }, 1000);

    return () => {
      if (calculateTimeoutRef.current) {
        clearTimeout(calculateTimeoutRef.current);
      }
    };
  }, [startLocation, endLocation, trip.startLocation, trip.endLocation]);

  const handleSave = async () => {
    try {
      // Validate locations first (most common issue)
      const trimmedStart = (startLocation || '').trim();
      const trimmedEnd = (endLocation || '').trim();
      
      if (!trimmedStart) {
        alert('Please enter a starting address');
        return;
      }
      
      if (!trimmedEnd) {
        alert('Please enter a destination address');
        return;
      }

      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      // Validate dates
      if (isNaN(startDateTime.getTime())) {
        alert('Please enter a valid start date and time');
        return;
      }
      
      if (isNaN(endDateTime.getTime())) {
        alert('Please enter a valid end date and time');
        return;
      }

      // Validate distance
      const distanceNum = parseFloat(distance || '0');
      if (isNaN(distanceNum) || distanceNum < 0) {
        alert('Please enter a valid distance (must be 0 or greater)');
        return;
      }

      // Get mileage rate
      const settings = StorageService.getSettings();
      const mileageRate = settings.mileageRate || 0.67;

      // Try to get coordinates for the addresses (optional - won't fail if it doesn't work)
      let startCoords = { lat: trip.startLatitude, lng: trip.startLongitude };
      let endCoords = { lat: trip.endLatitude, lng: trip.endLongitude };

      // Only geocode if addresses have changed (to avoid unnecessary API calls)
      if (trimmedStart !== trip.startLocation || trimmedEnd !== trip.endLocation) {
        try {
          const startResult = await locationService.geocodeAddress(trimmedStart);
          const endResult = await locationService.geocodeAddress(trimmedEnd);
          if (startResult) startCoords = startResult;
          if (endResult) endCoords = endResult;
        } catch (error) {
          console.log('Could not geocode addresses, using existing coordinates');
        }
      }

      const updatedTrip: Trip = {
        ...trip,
        startDate: startDateTime,
        endDate: endDateTime,
        startLocation: trimmedStart,
        endLocation: trimmedEnd,
        startLatitude: startCoords.lat,
        startLongitude: startCoords.lng,
        endLatitude: endCoords.lat,
        endLongitude: endCoords.lng,
        distance: distanceNum,
        category,
        notes: (notes || '').trim(),
        mileageRate,
        totalDeduction: parseFloat((distanceNum * mileageRate).toFixed(2))
      };

      onUpdate(updatedTrip);
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('An error occurred while saving. Please try again.');
    }
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
          <label className="form-label">
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Starting Address</span>
            <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              (Editable)
            </span>
          </label>
          <input
            type="text"
            className="form-input"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            placeholder="Enter starting address (e.g., 123 Main St, City, State)"
            style={{ fontSize: '14px', padding: '12px' }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
            You can edit this address if needed
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Destination Address</span>
            <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              (Editable)
            </span>
          </label>
          <input
            type="text"
            className="form-input"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
            placeholder="Enter destination address (e.g., 456 Oak Ave, City, State)"
            style={{ fontSize: '14px', padding: '12px' }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
            You can edit this address if needed
          </p>
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
          <label className="form-label">
            Distance (miles)
            {isCalculatingDistance && (
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--primary-color)', marginLeft: '8px' }}>
                Calculating...
              </span>
            )}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="0.00"
              disabled={isCalculatingDistance}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={async () => {
                const trimmedStart = (startLocation || '').trim();
                const trimmedEnd = (endLocation || '').trim();
                
                if (!trimmedStart || !trimmedEnd) {
                  alert('Please enter both starting and destination addresses first');
                  return;
                }

                setIsCalculatingDistance(true);
                try {
                  const calculatedDistance = await locationService.calculateDistanceFromAddresses(
                    trimmedStart,
                    trimmedEnd
                  );

                  if (calculatedDistance !== null) {
                    setDistance(calculatedDistance.toFixed(2));
                  } else {
                    alert('Could not calculate distance. Please enter it manually.');
                  }
                } catch (error) {
                  console.error('Error calculating distance:', error);
                  alert('Error calculating distance. Please enter it manually.');
                } finally {
                  setIsCalculatingDistance(false);
                }
              }}
              disabled={isCalculatingDistance || !startLocation.trim() || !endLocation.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              Calculate
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
            {isCalculatingDistance 
              ? 'Calculating distance from addresses...' 
              : 'Distance updates automatically when you enter both addresses. Use "Calculate" to recalculate or edit manually.'}
          </p>
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

      {/* Linked Expenses Section */}
      {!isNewTrip && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>Linked Expenses</h3>
            <button
              className="btn btn-primary"
              onClick={() => {
                const now = new Date();
                const newExpense: Expense = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  date: now,
                  amount: 0,
                  category: ExpenseCategory.Other,
                  description: '',
                  notes: '',
                  tripId: trip.id
                };
                setSelectedExpense(newExpense);
              }}
            >
              + Add Expense
            </button>
          </div>
          
          {tripExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>No expenses linked to this trip</p>
            </div>
          ) : (
            <>
              {tripExpenses.map((expense) => (
                <div key={expense.id}>
                  <div
                    className="trip-item"
                    onClick={() => setSelectedExpense(expense)}
                    style={{ marginBottom: '8px', cursor: 'pointer' }}
                  >
                    <div className="trip-header">
                      <span className="trip-category">{expense.category}</span>
                      <span className="trip-date">{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontWeight: '500' }}>{expense.description}</div>
                    </div>
                    <div className="trip-details">
                      <div></div>
                      <div className="trip-amount">${expense.amount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div className="flex-between">
                  <span style={{ fontWeight: '600' }}>Total Expenses:</span>
                  <span style={{ fontWeight: '600', fontSize: '18px', color: 'var(--success-color)' }}>
                    ${tripExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {selectedExpense && (
        <ExpenseDetailView
          expense={selectedExpense}
          preLinkedTripId={trip.id}
          onClose={() => {
            setSelectedExpense(null);
            // Reload expenses
            if (trip.id) {
              const expenses = StorageService.getExpensesForTrip(trip.id);
              setTripExpenses(expenses);
            }
          }}
          onUpdate={(updated) => {
            if (tripExpenses.find(e => e.id === updated.id)) {
              StorageService.updateExpense(updated);
            } else {
              StorageService.saveExpense(updated);
            }
            setSelectedExpense(updated);
            // Reload expenses
            if (trip.id) {
              const expenses = StorageService.getExpensesForTrip(trip.id);
              setTripExpenses(expenses);
            }
          }}
          onDelete={(id) => {
            StorageService.deleteExpense(id);
            setSelectedExpense(null);
            // Reload expenses
            if (trip.id) {
              const expenses = StorageService.getExpensesForTrip(trip.id);
              setTripExpenses(expenses);
            }
          }}
        />
      )}

      {!selectedExpense && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button 
          className="btn btn-primary btn-full" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
          }}
          type="button"
        >
          {isNewTrip ? 'Save Trip' : 'Save Changes'}
        </button>
        {!isNewTrip && (
          <button 
            className="btn btn-danger" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete();
            }}
            type="button"
          >
            Delete
          </button>
        )}
        </div>
      )}
    </div>
  );
}

export default TripDetailView;


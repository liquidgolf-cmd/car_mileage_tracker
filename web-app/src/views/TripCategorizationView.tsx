import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ActiveTripService, ActiveTripData } from '../services/ActiveTripService';
import { StorageService } from '../services/StorageService';
import { TripCategory, Trip, Business } from '../types';

function TripCategorizationView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tripData, setTripData] = useState<ActiveTripData | null>(null);
  const [category, setCategory] = useState<TripCategory>(TripCategory.Uncategorized);
  const [businessId, setBusinessId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showNewBusinessInput, setShowNewBusinessInput] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Get trip data from location state or ActiveTripService
    const stateData = (location.state as { tripData?: ActiveTripData })?.tripData;
    const activeTripData = ActiveTripService.getActiveTrip();
    const data = stateData || activeTripData;
    
    console.log('[Trip Categorization] Loading trip data:', {
      fromState: !!stateData,
      fromActiveTrip: !!activeTripData,
      hasData: !!data,
      hasStartLocation: !!data?.startLocation,
      hasCurrentLocation: !!data?.currentLocation
    });
    
    if (!data) {
      // No trip data available at all, redirect to home
      console.error('[Trip Categorization] No trip data found, redirecting to home');
      navigate('/');
      return;
    }

    // Allow trips even without location data - user can still save it
    // Just use default/empty locations if missing
    if (!data.startLocation || !data.currentLocation) {
      console.warn('[Trip Categorization] Trip missing location data, using defaults');
      // Create default location data if missing
      data.startLocation = data.startLocation || {
        latitude: 0,
        longitude: 0,
        address: 'Location not available',
        timestamp: new Date(data.startTime)
      };
      data.currentLocation = data.currentLocation || {
        latitude: 0,
        longitude: 0,
        address: 'Location not available',
        timestamp: new Date()
      };
    }

    setTripData(data);
    setCategory(data.category || TripCategory.Uncategorized);
    setNotes(data.notes || '');
  }, [location.state, navigate]);

  if (!tripData) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading trip data...</p>
        </div>
      </div>
    );
  }

  const businesses = StorageService.getBusinesses();
  const duration = Math.floor((Date.now() - tripData.startTime) / 1000);
  
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveTrip = async () => {
    if (category === TripCategory.Uncategorized) {
      setError('Please select a category');
      return;
    }

    if (category === TripCategory.Business && !businessId && businesses.length > 0) {
      // Business category selected but no business chosen (and businesses exist)
      // This is optional, so we'll allow it
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get end location address
      let endAddress = tripData.currentLocation!.address;
      if (!endAddress) {
        endAddress = `${tripData.currentLocation!.latitude.toFixed(6)}, ${tripData.currentLocation!.longitude.toFixed(6)}`;
      }

      const settings = StorageService.getSettings();
      const mileageRate = settings.mileageRate || 0.67;

      const trip: Trip = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        startDate: new Date(tripData.startTime),
        endDate: new Date(),
        startLocation: tripData.startLocation!.address || `${tripData.startLocation!.latitude.toFixed(6)}, ${tripData.startLocation!.longitude.toFixed(6)}`,
        endLocation: endAddress,
        startLatitude: tripData.startLocation!.latitude,
        startLongitude: tripData.startLocation!.longitude,
        endLatitude: tripData.currentLocation!.latitude,
        endLongitude: tripData.currentLocation!.longitude,
        distance: parseFloat(tripData.distance.toFixed(2)),
        category,
        businessId: businessId || undefined,
        notes: notes.trim(),
        mileageRate,
        totalDeduction: parseFloat((tripData.distance * mileageRate).toFixed(2))
      };

      StorageService.saveTrip(trip);
      
      // Clear active trip
      ActiveTripService.clearActiveTrip();
      
      navigate('/trips');
    } catch (err) {
      setError('Error saving trip. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForLater = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Get end location address
      let endAddress = tripData.currentLocation!.address;
      if (!endAddress) {
        endAddress = `${tripData.currentLocation!.latitude.toFixed(6)}, ${tripData.currentLocation!.longitude.toFixed(6)}`;
      }

      const settings = StorageService.getSettings();
      const mileageRate = settings.mileageRate || 0.67;

      const trip: Trip = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        startDate: new Date(tripData.startTime),
        endDate: new Date(),
        startLocation: tripData.startLocation!.address || `${tripData.startLocation!.latitude.toFixed(6)}, ${tripData.startLocation!.longitude.toFixed(6)}`,
        endLocation: endAddress,
        startLatitude: tripData.startLocation!.latitude,
        startLongitude: tripData.startLocation!.longitude,
        endLatitude: tripData.currentLocation!.latitude,
        endLongitude: tripData.currentLocation!.longitude,
        distance: parseFloat(tripData.distance.toFixed(2)),
        category: TripCategory.Uncategorized,
        notes: notes.trim(),
        mileageRate,
        totalDeduction: parseFloat((tripData.distance * mileageRate).toFixed(2))
      };

      StorageService.saveTrip(trip);
      
      // Clear active trip
      ActiveTripService.clearActiveTrip();
      
      navigate('/trips');
    } catch (err) {
      setError('Error saving trip. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Discard this trip? This cannot be undone.')) {
      ActiveTripService.clearActiveTrip();
      navigate('/');
    }
  };

  const handleAddBusiness = () => {
    const trimmed = newBusinessName.trim();
    if (!trimmed) {
      alert('Please enter a business name');
      return;
    }

    if (businesses.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('This business name already exists');
      return;
    }

    const business: Business = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: trimmed,
      createdAt: new Date()
    };

    StorageService.saveBusiness(business);
    setBusinessId(business.id);
    setNewBusinessName('');
    setShowNewBusinessInput(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Categorize Trip</h2>

        {/* Trip Summary */}
        <div style={{ 
          background: 'var(--background)', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '20px' 
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Distance</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{tripData.distance.toFixed(2)} miles</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Duration</div>
            <div style={{ fontSize: '20px', fontWeight: '500' }}>{formatDuration(duration)}</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div><strong>From:</strong> {tripData.startLocation?.address || 'Getting address...'}</div>
            <div style={{ marginTop: '4px' }}><strong>To:</strong> {tripData.currentLocation?.address || 'Getting address...'}</div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="form-group">
          <label className="form-label">Category *</label>
          <div className="segmented-control">
            {Object.values(TripCategory).filter(cat => cat !== TripCategory.Uncategorized).map((cat) => (
              <button
                key={cat}
                className={category === cat ? 'active' : ''}
                onClick={() => {
                  setCategory(cat);
                  if (cat !== TripCategory.Business) {
                    setBusinessId('');
                  }
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Business Selection (only for Business category) */}
        {category === TripCategory.Business && (
          <div className="form-group">
            <label className="form-label">Business (Optional)</label>
            {businesses.length > 0 && (
              <select
                className="form-select"
                value={businessId}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setShowNewBusinessInput(true);
                  } else {
                    setBusinessId(e.target.value);
                    setShowNewBusinessInput(false);
                  }
                }}
              >
                <option value="">No business selected</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
                <option value="__new__">+ Add New Business</option>
              </select>
            )}
            
            {showNewBusinessInput && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="Business name"
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddBusiness();
                    }
                    if (e.key === 'Escape') {
                      setShowNewBusinessInput(false);
                      setNewBusinessName('');
                    }
                  }}
                  autoFocus
                />
                <button className="btn btn-primary" onClick={handleAddBusiness}>
                  Add
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowNewBusinessInput(false);
                    setNewBusinessName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {businesses.length === 0 && (
              <div style={{ marginTop: '8px' }}>
                <button
                  className="btn btn-outline btn-full"
                  onClick={() => setShowNewBusinessInput(true)}
                >
                  + Add Business
                </button>
                {showNewBusinessInput && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={newBusinessName}
                      onChange={(e) => setNewBusinessName(e.target.value)}
                      placeholder="Business name"
                      style={{ flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddBusiness();
                        }
                        if (e.key === 'Escape') {
                          setShowNewBusinessInput(false);
                          setNewBusinessName('');
                        }
                      }}
                      autoFocus
                    />
                    <button className="btn btn-primary" onClick={handleAddBusiness}>
                      Add
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setShowNewBusinessInput(false);
                        setNewBusinessName('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes (Optional)</label>
          <textarea
            className="form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this trip..."
            rows={3}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
          <button 
            className="btn btn-primary btn-full" 
            onClick={handleSaveTrip}
            disabled={isSaving || category === TripCategory.Uncategorized}
          >
            {isSaving ? 'Saving...' : 'Save Trip'}
          </button>
          
          <button 
            className="btn btn-outline btn-full" 
            onClick={handleSaveForLater}
            disabled={isSaving}
          >
            Do This Later
          </button>
          
          <button 
            className="btn btn-outline btn-full" 
            onClick={handleDiscard}
            disabled={isSaving}
            style={{ color: 'var(--danger-color)' }}
          >
            Discard Trip
          </button>
        </div>
      </div>
    </div>
  );
}

export default TripCategorizationView;


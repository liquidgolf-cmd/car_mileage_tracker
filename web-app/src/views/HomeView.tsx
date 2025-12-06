import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/SubscriptionService';
import { ActiveTripService } from '../services/ActiveTripService';
import { locationService } from '../services/LocationService';
import { StorageService } from '../services/StorageService';
import { AutoTrackingService } from '../services/AutoTrackingService';
import { SubscriptionStatus, TripCategory } from '../types';
import ActiveTripView from './ActiveTripView';
import SubscriptionView from './SubscriptionView';

function HomeView() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isTracking, setIsTracking] = useState(ActiveTripService.isActive());
  const [isAutoTrackingEnabled, setIsAutoTrackingEnabled] = useState(AutoTrackingService.isAutoTrackingEnabled());
  const [isDriving, setIsDriving] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updateSubscriptionStatus();
    // Check if there's an active trip
    setIsTracking(ActiveTripService.isActive());
    
    // Subscribe to active trip changes
    const unsubscribeTrip = ActiveTripService.subscribe((tripData) => {
      setIsTracking(tripData !== null);
    });

    // Subscribe to auto-tracking status
    const unsubscribeAuto = AutoTrackingService.subscribe((driving) => {
      setIsDriving(driving);
      setIsAutoTrackingEnabled(AutoTrackingService.isAutoTrackingEnabled());
      
      // If auto-tracking started a trip, update tracking state
      if (driving && ActiveTripService.isActive()) {
        setIsTracking(true);
      }
    });

    // Check initial auto-tracking state
    setIsAutoTrackingEnabled(AutoTrackingService.isAutoTrackingEnabled());
    setIsDriving(AutoTrackingService.isCurrentlyDriving());

    return () => {
      unsubscribeTrip();
      unsubscribeAuto();
    };
  }, []);

  const updateSubscriptionStatus = () => {
    setSubscriptionStatus(subscriptionService.getSubscriptionStatus());
  };

  const handleStartTrip = async () => {
    if (!subscriptionStatus) {
      updateSubscriptionStatus();
      return;
    }

    if (!subscriptionService.canStartTrip()) {
      setShowSubscription(true);
      return;
    }

    // Check location permission
    try {
      const hasPermission = await locationService.requestPermission();
      if (!hasPermission) {
        alert(
          'Location permission is required to track trips.\n\n' +
          'Please:\n' +
          '1. Allow location access when your browser prompts you\n' +
          '2. Check your browser settings to ensure location is enabled\n' +
          '3. On Mac: Enable Location Services in System Settings → Privacy & Security'
        );
        return;
      }
    } catch (error) {
      // If permission check fails, try to start trip anyway
      // Location tracking will handle errors gracefully and may work once GPS signal is available
      console.warn('Location permission check had issues, but attempting to start trip:', error);
    }

    // Initialize active trip in service
    const settings = StorageService.getSettings();
    const defaultCategory = (settings.defaultCategory as TripCategory) || TripCategory.Business;

    ActiveTripService.saveActiveTrip({
      startTime: Date.now(),
      startLocation: null,
      currentLocation: null,
      distance: 0,
      category: defaultCategory,
      notes: ''
    });

    // Start location tracking
    console.log('[Start Trip] Starting location tracking...');
    locationService.startTracking(
      (location) => {
        console.log('[Start Trip] Location received, updating trip:', {
          lat: location.latitude,
          lng: location.longitude,
          address: location.address
        });
        ActiveTripService.updateLocation(location);
      },
      (err) => {
        console.error('[Start Trip] Location tracking error:', err);
      }
    );

    // Start timer
    ActiveTripService.startTimer(() => {
      ActiveTripService.updateDuration();
    });

    setIsTracking(true);
  };

  const handleTripEnded = () => {
    setIsTracking(false);
    updateSubscriptionStatus();
    navigate('/trips');
  };

  if (isTracking) {
    return <ActiveTripView onTripEnded={handleTripEnded} />;
  }

  return (
    <div className="container">
      <h1 className="text-center" style={{ marginTop: '40px', marginBottom: '40px' }}>
        Mileage Tracker
      </h1>

      {/* Auto-Tracking Status */}
      {isAutoTrackingEnabled && (
        <div className="card" style={{ 
          background: isDriving ? 'rgba(52, 199, 89, 0.1)' : 'var(--surface)',
          border: `1px solid ${isDriving ? 'var(--success-color)' : 'var(--border-color)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {isDriving ? '🟢 Auto-Tracking Active' : '⚪ Auto-Tracking Monitoring'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isDriving 
                  ? 'Trip started automatically - driving detected'
                  : 'Monitoring for driving activity'}
              </div>
              {isDriving && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Speed: {Math.round(AutoTrackingService.getCurrentSpeed())} mph
                </div>
              )}
              {!isDriving && AutoTrackingService.getCurrentSpeed() > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Speed: {Math.round(AutoTrackingService.getCurrentSpeed())} mph (need 10 mph for 30s to start)
                </div>
              )}
            </div>
          </div>
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            background: 'var(--background)', 
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <strong>Note:</strong> Auto-tracking requires the app to be open. Web apps cannot track in the background when closed.
          </div>
        </div>
      )}

      {subscriptionStatus && !subscriptionStatus.isPremium && (
        <div className="card text-center">
          <div className="text-secondary mb-1">Trips This Month</div>
          <div
            className="big-number"
            style={{
              color: 'var(--primary-color)'
            }}
          >
            {subscriptionStatus.tripsThisMonth}
          </div>
          <div className="text-secondary" style={{ fontSize: '14px', marginTop: '4px' }}>
            Unlimited trips
          </div>
        </div>
      )}

      <div style={{ marginTop: '60px', marginBottom: '60px' }}>
        <button
          className="btn btn-primary btn-full btn-large"
          onClick={handleStartTrip}
          disabled={subscriptionStatus ? !subscriptionService.canStartTrip() : false}
          style={{
            background: subscriptionStatus && subscriptionService.canStartTrip()
              ? 'var(--primary-color)'
              : 'var(--text-secondary)',
            opacity: subscriptionStatus && subscriptionService.canStartTrip() ? 1 : 0.5
          }}
        >
          <span style={{ fontSize: '48px', marginBottom: '8px' }}>📍</span>
          <div>Start Trip</div>
        </button>
      </div>

      {showSubscription && (
        <SubscriptionView
          onClose={() => setShowSubscription(false)}
          onSubscribed={() => {
            setShowSubscription(false);
            updateSubscriptionStatus();
          }}
        />
      )}
    </div>
  );
}

export default HomeView;


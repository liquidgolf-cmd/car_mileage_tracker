import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/SubscriptionService';
import { ActiveTripService } from '../services/ActiveTripService';
import { locationService } from '../services/LocationService';
import { StorageService } from '../services/StorageService';
import { SubscriptionStatus, TripCategory } from '../types';
import ActiveTripView from './ActiveTripView';
import SubscriptionView from './SubscriptionView';

function HomeView() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isTracking, setIsTracking] = useState(ActiveTripService.isActive());
  const [showSubscription, setShowSubscription] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updateSubscriptionStatus();
    // Check if there's an active trip
    setIsTracking(ActiveTripService.isActive());
    
    // Subscribe to active trip changes
    const unsubscribe = ActiveTripService.subscribe((tripData) => {
      setIsTracking(tripData !== null);
    });

    return () => {
      unsubscribe();
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
    const hasPermission = await locationService.requestPermission();
    if (!hasPermission) {
      alert('Location permission denied. Please enable location access in your browser settings.');
      return;
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
    locationService.startTracking(
      (location) => {
        ActiveTripService.updateLocation(location);
      },
      (err) => {
        console.error('Location tracking error:', err);
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

      {subscriptionStatus && !subscriptionStatus.isPremium && (
        <div className="card text-center">
          <div className="text-secondary mb-1">Trips This Month</div>
          <div
            className="big-number"
            style={{
              color: subscriptionStatus.tripsThisMonth >= subscriptionStatus.freeTripsPerMonth ? 'var(--danger-color)' : 'var(--primary-color)'
            }}
          >
            {subscriptionStatus.tripsThisMonth}/{subscriptionStatus.freeTripsPerMonth}
          </div>
          {subscriptionStatus.tripsThisMonth >= subscriptionStatus.freeTripsPerMonth && (
            <button
              className="btn btn-primary mt-2"
              onClick={() => setShowSubscription(true)}
            >
              Upgrade to Premium
            </button>
          )}
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


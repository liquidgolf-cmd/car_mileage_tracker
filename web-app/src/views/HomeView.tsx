import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/SubscriptionService';
import { SubscriptionStatus } from '../types';
import ActiveTripView from './ActiveTripView';
import SubscriptionView from './SubscriptionView';

function HomeView() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updateSubscriptionStatus();
  }, []);

  const updateSubscriptionStatus = () => {
    setSubscriptionStatus(subscriptionService.getSubscriptionStatus());
  };

  const handleStartTrip = () => {
    if (!subscriptionStatus) {
      updateSubscriptionStatus();
      return;
    }

    if (subscriptionService.canStartTrip()) {
      setIsTracking(true);
    } else {
      setShowSubscription(true);
    }
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


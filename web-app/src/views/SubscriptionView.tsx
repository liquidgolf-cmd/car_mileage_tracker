import { useState } from 'react';
import { subscriptionService } from '../services/SubscriptionService';

interface SubscriptionViewProps {
  onClose: () => void;
  onSubscribed: () => void;
}

function SubscriptionView({ onClose, onSubscribed }: SubscriptionViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await subscriptionService.purchasePremium();
      onSubscribed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Premium</h2>
          <button className="btn btn-outline" onClick={onClose}>✕</button>
        </div>

        <div className="text-center" style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⭐</div>
          <h3 style={{ marginBottom: '8px' }}>Upgrade to Premium</h3>
          <p className="text-secondary">Get unlimited trips and more features</p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>∞</span>
            <span>Unlimited trips per month</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>☁️</span>
            <span>Cloud backup (coming soon)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <span>Advanced reports (coming soon)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>👑</span>
            <span>Priority support</span>
          </div>
        </div>

        <div className="text-center" style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>$4.99</div>
          <p className="text-secondary">per month</p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger-color)', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary btn-full btn-large"
          onClick={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Subscribe Now'}
        </button>

        <button
          className="btn btn-outline btn-full mt-2"
          onClick={() => subscriptionService.restorePurchases()}
        >
          Restore Purchases
        </button>
      </div>
    </div>
  );
}

export default SubscriptionView;


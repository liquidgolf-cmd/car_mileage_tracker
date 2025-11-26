import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService, AppSettings } from '../services/StorageService';
import { subscriptionService } from '../services/SubscriptionService';
import { AutoTrackingService } from '../services/AutoTrackingService';
import { locationService } from '../services/LocationService';
import { AuthService } from '../services/AuthService';
import { TripCategory, SubscriptionStatus, ExpenseCategory, Business } from '../types';
import SubscriptionView from './SubscriptionView';

function BusinessAdder({ onBusinessAdded }: { onBusinessAdded: () => void }) {
  const [newBusiness, setNewBusiness] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    const trimmed = newBusiness.trim();
    if (!trimmed) {
      alert('Please enter a business name');
      return;
    }

    const businesses = StorageService.getBusinesses();
    if (businesses.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('This business name already exists');
      setNewBusiness('');
      return;
    }

    const business: Business = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: trimmed,
      createdAt: new Date()
    };

    StorageService.saveBusiness(business);
    setNewBusiness('');
    setIsAdding(false);
    onBusinessAdded();
  };

  if (!isAdding) {
    return (
      <button
        className="btn btn-outline btn-full"
        onClick={() => setIsAdding(true)}
      >
        + Add Business
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="text"
        className="form-input"
        value={newBusiness}
        onChange={(e) => setNewBusiness(e.target.value)}
        placeholder="Business name"
        style={{ flex: 1 }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleAdd();
          }
          if (e.key === 'Escape') {
            setIsAdding(false);
            setNewBusiness('');
          }
        }}
        autoFocus
      />
      <button className="btn btn-primary" onClick={handleAdd}>
        Add
      </button>
      <button
        className="btn btn-outline"
        onClick={() => {
          setIsAdding(false);
          setNewBusiness('');
        }}
      >
        Cancel
      </button>
    </div>
  );
}

function CustomCategoryAdder({ onCategoryAdded }: { onCategoryAdded: () => void }) {
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      alert('Please enter a category name');
      return;
    }

    const allCategories = [
      ...Object.values(ExpenseCategory),
      ...StorageService.getCustomExpenseCategories()
    ];

    if (allCategories.includes(trimmed)) {
      alert('This category already exists');
      setNewCategory('');
      return;
    }

    StorageService.addCustomExpenseCategory(trimmed);
    setNewCategory('');
    setIsAdding(false);
    onCategoryAdded();
  };

  if (!isAdding) {
    return (
      <button
        className="btn btn-outline btn-full"
        onClick={() => setIsAdding(true)}
      >
        + Add Custom Category
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="text"
        className="form-input"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
        placeholder="Category name"
        style={{ flex: 1 }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleAdd();
          }
          if (e.key === 'Escape') {
            setIsAdding(false);
            setNewCategory('');
          }
        }}
        autoFocus
      />
      <button className="btn btn-primary" onClick={handleAdd}>
        Add
      </button>
      <button
        className="btn btn-outline"
        onClick={() => {
          setIsAdding(false);
          setNewCategory('');
        }}
      >
        Cancel
      </button>
    </div>
  );
}

function SettingsView() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showRateEditor, setShowRateEditor] = useState(false);
  const [editedRate, setEditedRate] = useState(settings.mileageRate.toString());
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(AutoTrackingService.isAutoTrackingEnabled());
  const [currentUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    setSubscriptionStatus(subscriptionService.getSubscriptionStatus());
    setAutoTrackingEnabled(AutoTrackingService.isAutoTrackingEnabled());
    
    // Subscribe to auto-tracking changes
    const unsubscribe = AutoTrackingService.subscribe(() => {
      setAutoTrackingEnabled(AutoTrackingService.isAutoTrackingEnabled());
    });
    
    return () => unsubscribe();
  }, []);

  const handleSaveSettings = () => {
    StorageService.saveSettings({
      defaultCategory: settings.defaultCategory,
      mileageRate: parseFloat(editedRate) || 0.67
    });
    setSettings({ ...settings, mileageRate: parseFloat(editedRate) || 0.67 });
    setShowRateEditor(false);
  };

  return (
    <div className="container">
      <h1 style={{ marginTop: '20px', marginBottom: '20px' }}>Settings</h1>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Subscription</h3>
        <div className="flex-between mb-2">
          <span>Status</span>
          <span style={{ fontWeight: '600', color: subscriptionStatus?.isPremium ? 'var(--success-color)' : 'var(--text-secondary)' }}>
            {subscriptionStatus?.isPremium ? 'Premium' : 'Free'}
          </span>
        </div>
        {!subscriptionStatus?.isPremium && (
          <button
            className="btn btn-primary btn-full mt-2"
            onClick={() => setShowSubscription(true)}
          >
            Upgrade to Premium
          </button>
        )}
        <button
          className="btn btn-outline btn-full mt-2"
          onClick={() => subscriptionService.restorePurchases()}
        >
          Restore Purchases
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Trip Settings</h3>
        
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <div className="flex-between">
            <div>
              <label className="form-label" style={{ marginBottom: '4px' }}>Auto-Tracking</label>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Automatically detect and record trips when driving
              </p>
            </div>
            <button
              className="btn"
              onClick={async () => {
                const enabled = !autoTrackingEnabled;
                if (enabled) {
                  // Request permission first
                  const hasPermission = await locationService.requestPermission();
                  if (!hasPermission) {
                    alert('Location permission is required for auto-tracking. Please enable location access in your browser settings.');
                    return;
                  }
                }
                
                if (enabled) {
                  AutoTrackingService.enableAutoTracking();
                } else {
                  AutoTrackingService.disableAutoTracking();
                }
                AutoTrackingService.savePreference(enabled);
                setAutoTrackingEnabled(enabled);
              }}
              style={{
                background: autoTrackingEnabled ? 'var(--primary-color)' : 'var(--border-color)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                minWidth: '60px',
                transition: 'all 0.2s'
              }}
            >
              {autoTrackingEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {autoTrackingEnabled && (
            <div style={{ 
              marginTop: '12px', 
              padding: '12px', 
              background: 'var(--background)', 
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              <strong>Note:</strong> Auto-tracking works best when the app is open or running in the background. 
              Web apps have limited background capabilities. For best results, keep the app open or use a mobile browser 
              that supports background location tracking.
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label className="form-label">Default Category</label>
          <select
            className="form-select"
            value={settings.defaultCategory}
            onChange={(e) => {
              const newSettings = { ...settings, defaultCategory: e.target.value };
              setSettings(newSettings);
              StorageService.saveSettings(newSettings);
            }}
          >
            {Object.values(TripCategory).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Mileage Rate</label>
          <div
            className="flex-between"
            style={{ padding: '12px', background: 'var(--background)', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => setShowRateEditor(true)}
          >
            <span>${settings.mileageRate.toFixed(2)}/mile</span>
            <span className="text-secondary">Tap to edit</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            2025 IRS standard rate: $0.67/mile. You can adjust this for past years or special cases.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Expense Categories</h3>
        
        <div className="form-group">
          <label className="form-label">Custom Categories</label>
          {StorageService.getCustomExpenseCategories().length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              No custom categories yet. Add one below or when creating an expense.
            </p>
          ) : (
            <div style={{ marginTop: '8px', marginBottom: '16px' }}>
              {StorageService.getCustomExpenseCategories().map((category) => {
                const inUse = StorageService.isCustomCategoryInUse(category);
                return (
                  <div
                    key={category}
                    className="flex-between"
                    style={{
                      padding: '12px',
                      background: 'var(--background)',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <span>{category}</span>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        if (inUse) {
                          alert(`Cannot delete "${category}" because it's being used by one or more expenses.`);
                        } else if (window.confirm(`Delete custom category "${category}"?`)) {
                          StorageService.removeCustomExpenseCategory(category);
                          // Force re-render
                          setSettings({ ...settings });
                        }
                      }}
                      disabled={inUse}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        opacity: inUse ? 0.5 : 1
                      }}
                    >
                      {inUse ? 'In Use' : 'Delete'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <CustomCategoryAdder onCategoryAdded={() => {
            // Force re-render
            setSettings({ ...settings });
          }} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Businesses</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Manage your business entities. Assign trips and expenses to specific businesses.
        </p>
        
        {StorageService.getBusinesses().length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            No businesses yet. Add one below.
          </p>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            {StorageService.getBusinesses().map((business) => {
              const inUse = StorageService.isBusinessInUse(business.id);
              return (
                <div
                  key={business.id}
                  className="flex-between"
                  style={{
                    padding: '12px',
                    background: 'var(--background)',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>{business.name}</span>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      if (inUse) {
                        alert(`Cannot delete "${business.name}" because it's being used by one or more trips or expenses.`);
                      } else if (window.confirm(`Delete business "${business.name}"?`)) {
                        StorageService.deleteBusiness(business.id);
                        // Force re-render
                        setSettings({ ...settings });
                      }
                    }}
                    disabled={inUse}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      opacity: inUse ? 0.5 : 1
                    }}
                  >
                    {inUse ? 'In Use' : 'Delete'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        <BusinessAdder onBusinessAdded={() => {
          // Force re-render
          setSettings({ ...settings });
        }} />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Account</h3>
        {currentUser && (
          <div className="flex-between mb-2">
            <span>Name</span>
            <span style={{ fontWeight: '500' }}>{currentUser.name}</span>
          </div>
        )}
        {currentUser && (
          <div className="flex-between mb-2">
            <span>Email</span>
            <span style={{ color: 'var(--text-secondary)' }}>{currentUser.email}</span>
          </div>
        )}
        <button
          className="btn btn-outline btn-full mt-3"
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out?')) {
              AuthService.logout();
              navigate('/login');
            }
          }}
          style={{ color: 'var(--danger-color)' }}
        >
          Sign Out
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>About</h3>
        <div className="flex-between mb-2">
          <span>Version</span>
          <span>1.0.0</span>
        </div>
      </div>

      {showRateEditor && (
        <div className="card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, maxWidth: '400px', width: '90%' }}>
          <h3 style={{ marginBottom: '20px' }}>Mileage Rate</h3>
          <div className="form-group">
            <label className="form-label">Rate per mile</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={editedRate}
              onChange={(e) => setEditedRate(e.target.value)}
              placeholder="0.67"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline btn-full" onClick={() => setShowRateEditor(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-full" onClick={handleSaveSettings}>
              Save
            </button>
          </div>
        </div>
      )}

      {showSubscription && (
        <SubscriptionView
          onClose={() => setShowSubscription(false)}
          onSubscribed={() => {
            setShowSubscription(false);
            setSubscriptionStatus(subscriptionService.getSubscriptionStatus());
          }}
        />
      )}
    </div>
  );
}

export default SettingsView;


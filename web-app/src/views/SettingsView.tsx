import { useState, useEffect } from 'react';
import { StorageService, AppSettings } from '../services/StorageService';
import { subscriptionService } from '../services/SubscriptionService';
import { TripCategory, SubscriptionStatus, ExpenseCategory } from '../types';
import SubscriptionView from './SubscriptionView';

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
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showRateEditor, setShowRateEditor] = useState(false);
  const [editedRate, setEditedRate] = useState(settings.mileageRate.toString());

  useEffect(() => {
    setSubscriptionStatus(subscriptionService.getSubscriptionStatus());
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


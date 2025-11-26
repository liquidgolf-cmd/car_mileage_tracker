import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/AuthService';
import { Business } from '../types';

function SignUpView() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Account info, 2: Businesses
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Move to step 2
    setStep(2);
    setError(null);
  };

  const handleAddBusiness = () => {
    const trimmed = newBusinessName.trim();
    if (!trimmed) {
      setError('Please enter a business name');
      return;
    }

    if (businesses.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('This business name already exists');
      return;
    }

    const business: Business = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: trimmed,
      createdAt: new Date()
    };

    setBusinesses([...businesses, business]);
    setNewBusinessName('');
    setError(null);
  };

  const handleRemoveBusiness = (businessId: string) => {
    setBusinesses(businesses.filter(b => b.id !== businessId));
  };

  const handleSignUp = async () => {
    if (businesses.length === 0) {
      setError('Please add at least one business');
      return;
    }

    setIsLoading(true);
    setError(null);

    const success = await AuthService.signUp(email.trim(), password, name.trim(), businesses);

    if (success) {
      // Reload page to update auth state across components
      window.location.href = '/';
    } else {
      setError('Email already registered. Please sign in instead.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  if (step === 1) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '400px', margin: '60px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ marginBottom: '8px' }}>Create Account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Step 1 of 2: Account Information
            </p>
          </div>

          <form onSubmit={handleStep1Submit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Must be at least 6 characters
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid var(--danger-color)',
                borderRadius: '8px',
                color: 'var(--danger-color)',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginBottom: '16px' }}
            >
              Continue to Business Setup
            </button>
          </form>

          <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Already have an account?
            </p>
            <button
              className="btn btn-outline btn-full"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Business Setup
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ marginBottom: '8px' }}>Set Up Your Businesses</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Step 2 of 2: Add at least one business
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Add Business</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={newBusinessName}
              onChange={(e) => setNewBusinessName(e.target.value)}
              placeholder="e.g., My Consulting LLC"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBusiness();
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddBusiness}
            >
              Add
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            You can add more businesses later in Settings
          </div>
        </div>

        {businesses.length > 0 && (
          <div className="form-group">
            <label className="form-label">Your Businesses ({businesses.length})</label>
            <div style={{ 
              background: 'var(--background)', 
              borderRadius: '8px', 
              padding: '12px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {businesses.map((business) => (
                <div
                  key={business.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--surface)',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>{business.name}</span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleRemoveBusiness(business.id)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
            background: 'rgba(255, 59, 48, 0.1)',
            border: '1px solid var(--danger-color)',
            borderRadius: '8px',
            color: 'var(--danger-color)',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            className="btn btn-outline btn-full"
            onClick={handleBack}
            disabled={isLoading}
          >
            Back
          </button>
          <button
            className="btn btn-primary btn-full"
            onClick={handleSignUp}
            disabled={isLoading || businesses.length === 0}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: 'var(--background)', 
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <strong>Note:</strong> At least one business is required. You'll use these when categorizing trips and expenses.
        </div>
      </div>
    </div>
  );
}

export default SignUpView;


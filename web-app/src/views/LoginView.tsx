import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/AuthService';

function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));

    const success = AuthService.login(email.trim(), password);
    
    if (success) {
      // Reload page to update auth state across components
      window.location.href = '/';
    } else {
      setError('Invalid email or password');
      setPassword('');
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '60px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ marginBottom: '8px' }}>Car Mileage Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
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
            disabled={isLoading}
            style={{ marginBottom: '16px' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Don't have an account?
          </p>
          <button
            className="btn btn-outline btn-full"
            onClick={() => navigate('/signup')}
            disabled={isLoading}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginView;


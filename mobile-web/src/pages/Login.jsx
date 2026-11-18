import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Siren, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { API_BASE } from '../config';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Authentication failed with status ${res.status}`);
      }

      const data = await res.json();
      // Store token & user profile in sessionStorage (per checkpoint 1 requirements)
      sessionStorage.setItem('lifelane_driver_token', data.access_token);
      sessionStorage.setItem('lifelane_driver_user', JSON.stringify({
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        agency: data.agency
      }));

      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to connect to municipal gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setUsername('driver_blr');
    setPassword('driver123');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            backgroundColor: '#f36e20',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: '0 10px 25px -5px rgba(243, 110, 32, 0.4)'
          }}>
            <Siren size={30} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            LifeLane AI
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Emergency Response Driver Terminal
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #334155',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>
              Driver Sign In
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              Enter your assigned operator credentials to access the live HUD.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#451a1a',
              border: '1px solid #7f1d1d',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#fca5a5'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Driver Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  placeholder="e.g. driver_blr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                backgroundColor: '#f36e20',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to HUD'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Demo Quick-Fill */}
          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
            <button
              type="button"
              onClick={handleQuickDemo}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(243, 110, 32, 0.1)',
                border: '1px dashed #f36e20',
                color: '#f36e20',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} />
              <span>Fill Demo Credentials (Rajesh K · 108 BLR)</span>
            </button>
          </div>
        </div>

        {/* Registration Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          New emergency responder?{' '}
          <Link
            to="/register"
            style={{ color: '#f36e20', textDecoration: 'none', fontWeight: '700' }}
          >
            Register via QR Token →
          </Link>
        </div>

        {/* Security Notice */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>G6 Protected · Operator Approval Enforced</span>
        </div>
      </div>
    </div>
  );
}

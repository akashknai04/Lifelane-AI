import React, { useState } from 'react';
import { X, Shield, Lock, User, Building, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';

export function RequestDemoModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    agency: '',
    name: '',
    email: '',
    city: 'Bengaluru',
    fleetSize: '10-25'
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '520px',
        width: '100%',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#626462',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {!submitted ? (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fef2ec',
              color: '#f36e20',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              <Building size={12} />
              <span>Municipal Pilot Program</span>
            </div>

            <h3 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#3a3b3a',
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0'
            }}>
              Request Municipal Corridor Briefing
            </h3>

            <p style={{
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#626462',
              margin: '0 0 24px 0'
            }}>
              Connect with the LifeLane engineering team to schedule a digital twin simulation for your municipal traffic grid.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3a3b3a', marginBottom: '6px' }}>
                  Agency / Department Name
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Bengaluru Traffic Police / 108 EMS"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e0e1e0',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3a3b3a', marginBottom: '6px' }}>
                    Officer / Lead Name
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e0e1e0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3a3b3a', marginBottom: '6px' }}>
                    Official Email
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="name@gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e0e1e0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3a3b3a', marginBottom: '6px' }}>
                    Target City
                  </label>
                  <input 
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e0e1e0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3a3b3a', marginBottom: '6px' }}>
                    Emergency Fleet Size
                  </label>
                  <select
                    value={formData.fleetSize}
                    onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e0e1e0',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="1-10">1 – 10 Ambulances</option>
                    <option value="10-25">10 – 25 Vehicles</option>
                    <option value="25-100">25 – 100 Vehicles (Metropolitan)</option>
                    <option value="100+">100+ Vehicles (Full Fleet)</option>
                  </select>
                </div>
              </div>

              <div style={{
                backgroundColor: '#f8f8f8',
                border: '1px solid #e0e1e0',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                color: '#626462'
              }}>
                <strong style={{ color: '#3a3b3a' }}>Simulation Note:</strong> Submitting logs a demonstration inquiry into the local registry. No commercial contracts are initiated.
              </div>

              <button 
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                Submit Operational Briefing Request
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#ecfdf5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#10b981'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#3a3b3a', margin: '0 0 8px 0' }}>
              Briefing Request Registered
            </h3>
            
            <p style={{ fontSize: '14px', color: '#626462', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Thank you, <strong>{formData.name}</strong> ({formData.agency}). Your municipal request for <strong>{formData.city}</strong> has been assigned tracking code:
            </p>

            <div style={{
              fontFamily: 'monospace',
              fontSize: '16px',
              fontWeight: '700',
              backgroundColor: '#fef2ec',
              color: '#f36e20',
              padding: '12px 18px',
              borderRadius: '10px',
              display: 'inline-block',
              marginBottom: '24px',
              letterSpacing: '0.08em'
            }}>
              LL-DEMO-2026-{Math.floor(1000 + Math.random() * 9000)}
            </div>

            <button 
              onClick={() => { setSubmitted(false); onClose(); }}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PolicePortalModal({ isOpen, onClose, onOpenApprovals, onOpenDashboard }) {
  const [username, setUsername] = useState('police_op');
  const [password, setPassword] = useState('police123');
  const [loading, setLoading] = useState(false);
  const [authResponse, setAuthResponse] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
      }

      const data = await response.json();
      setAuthResponse(data);
      localStorage.setItem('lifelane_token', data.access_token);
      const userObj = data.user || {
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        agency: data.agency
      };
      localStorage.setItem('lifelane_user', JSON.stringify(userObj));
    } catch (err) {
      setError(err.message || 'Unable to connect to municipal authentication gateway.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '480px',
        width: '100%',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }}>
        {/* Close */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#626462',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {!authResponse ? (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fef2ec',
              color: '#f36e20',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              <Shield size={12} />
              <span>Municipal Control Room Access</span>
            </div>

            <h3 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#3a3b3a',
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0'
            }}>
              Police Portal Authorization
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#626462',
              lineHeight: 1.5,
              margin: '0 0 20px 0'
            }}>
              Sign in with your Traffic Police credentials to monitor active emergency corridors and manual signal overrides.
            </p>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3a3b3a', marginBottom: '6px' }}>
                  Operator Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '10px',
                      border: '1px solid #e0e1e0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <User size={16} color="#626462" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3a3b3a', marginBottom: '6px' }}>
                  Secure Passkey
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '10px',
                      border: '1px solid #e0e1e0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={16} color="#626462" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                </div>
              </div>

              {/* Quick Fill Demo Credentials */}
              <div style={{
                backgroundColor: '#f8f8f8',
                border: '1px solid #e0e1e0',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{ color: '#626462', fontWeight: '600' }}>Demo Sandbox Role Quick-Select:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    onClick={() => quickFill('police_op', 'police123')}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e1e0',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#3a3b3a',
                      cursor: 'pointer'
                    }}
                  >
                    Role: Police Operator (Traffic Command)
                  </button>
                  <button 
                    type="button"
                    onClick={() => quickFill('admin', 'admin123')}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e1e0',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#3a3b3a',
                      cursor: 'pointer'
                    }}
                  >
                    Role: Municipal Administrator (HQ)
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                {loading ? 'Authenticating with Backend...' : 'Authenticate & Access Console'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#ecfdf5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#10b981'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#3a3b3a', margin: '0 0 4px 0' }}>
              Authorization Granted
            </h3>
            
            <p style={{ fontSize: '13px', color: '#626462', margin: '0 0 16px 0' }}>
              Welcome, <strong>{authResponse.full_name || authResponse.user?.full_name || authResponse.username}</strong> ({authResponse.role || authResponse.user?.role})
            </p>

            <div style={{
              backgroundColor: '#f8f8f8',
              border: '1px solid #e0e1e0',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'left',
              fontSize: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '6px', color: '#3a3b3a', fontWeight: '700' }}>
                Active JWT Token Session:
              </div>
              <div style={{
                fontFamily: 'monospace',
                color: '#626462',
                wordBreak: 'break-all',
                backgroundColor: '#ffffff',
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #e0e1e0',
                fontSize: '11px'
              }}>
                {authResponse.access_token.substring(0, 48)}...
              </div>
              <div style={{ marginTop: '10px', color: '#10b981', fontWeight: '600' }}>
                ✓ Corridors Preemption: Enabled
              </div>
              <div style={{ color: '#10b981', fontWeight: '600' }}>
                ✓ CCTV Surveillance Feed: Connected (Bengaluru Central)
              </div>
            </div>

              <button 
                onClick={() => {
                  if (onOpenDashboard) onOpenDashboard(authResponse.access_token);
                  onClose();
                }}
                className="btn-primary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                <Shield size={16} color="#f36e20" />
                <span>Launch Police Control Dashboard (Live Map)</span>
              </button>

              <button 
                onClick={() => {
                  if (onOpenApprovals) onOpenApprovals(authResponse.access_token);
                  onClose();
                }}
                className="btn-primary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#f36e20',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Shield size={16} />
                <span>Open Driver Approvals & QR Manager</span>
              </button>

              <a 
                href="http://localhost:5174" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #e0e1e0',
                  color: '#3a3b3a',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                <span>Launch Driver Telemetry Terminal</span>
                <ExternalLink size={15} />
              </a>

              <button 
                onClick={() => { setAuthResponse(null); onClose(); }}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                Return to Site
              </button>
            </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lifelane_cookie_consent');
    if (!consent) {
      // Show banner after brief delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('lifelane_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleDeclineOptional = () => {
    localStorage.setItem('lifelane_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      role="region"
      aria-label="Privacy and Cookie Consent"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        right: '24px',
        maxWidth: '680px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e1e0',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        padding: '20px 24px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            backgroundColor: '#fef2ec',
            color: '#f36e20',
            padding: '8px',
            borderRadius: '10px',
            flexShrink: 0
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 style={{
              margin: '0 0 4px 0',
              fontSize: '15px',
              fontWeight: '700',
              color: '#3a3b3a'
            }}>
              Privacy & Local Session Preferences
            </h4>
            <p style={{
              margin: 0,
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#626462'
            }}>
              LifeLane AI uses local browser storage strictly to maintain authenticated operator sessions, simulator telemetry, and UI preferences. We do not use third-party advertising tracking.
            </p>
          </div>
        </div>

        <button 
          onClick={handleDeclineOptional}
          aria-label="Close Banner"
          style={{
            background: 'none',
            border: 'none',
            color: '#626462',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '10px',
        flexWrap: 'wrap',
        borderTop: '1px solid #e0e1e0',
        paddingTop: '12px'
      }}>
        <button
          onClick={handleDeclineOptional}
          className="btn-secondary"
          style={{
            padding: '8px 16px',
            fontSize: '13px'
          }}
        >
          Decline Optional
        </button>

        <button
          onClick={handleAcceptAll}
          className="btn-primary"
          style={{
            padding: '8px 20px',
            fontSize: '13px'
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}

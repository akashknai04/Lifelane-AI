import React from 'react';
import { Phone, Shield, ExternalLink, Activity } from 'lucide-react';

export default function UtilityBar({ onRequestDemo, onOpenPortal }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e1e0',
      padding: '8px 0',
      fontSize: '13px',
      color: '#626462'
    }}>
      <div className="container-custom" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left Status & Emergency Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: '600', color: '#3a3b3a' }}>
              Municipal Grid: Operational (Simulated)
            </span>
          </div>

          <a 
            href="tel:+918000000000" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#3a3b3a',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            <Phone size={13} color="#f36e20" />
            <span>Emergency Control Line: <strong style={{ color: '#f36e20' }}>+91 80 0000 0000</strong> (Demo Line · Non-Operational)</span>
          </a>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onRequestDemo}
            style={{
              background: 'none',
              border: 'none',
              color: '#3a3b3a',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '4px 8px'
            }}
          >
            Request a Demo
          </button>

          <span style={{ color: '#e0e1e0' }}>|</span>

          <button 
            onClick={onOpenPortal}
            style={{
              backgroundColor: '#fef2ec',
              color: '#f36e20',
              border: '1px solid rgba(243, 110, 32, 0.3)',
              borderRadius: '9999px',
              padding: '5px 14px',
              fontWeight: '700',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'all 0.2s'
            }}
          >
            <Shield size={13} />
            <span>Police Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
}

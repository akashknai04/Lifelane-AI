import React from 'react';
import { Phone, Mail, Github, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ContactBand({ onRequestDemo }) {
  return (
    <section id="contact" style={{
      backgroundColor: '#3a3b3a',
      color: '#ffffff',
      padding: '80px 0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        backgroundColor: 'rgba(243, 110, 32, 0.12)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      <div className="container-custom" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          {/* Left Callout */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(243, 110, 32, 0.2)',
              color: '#f36e20',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '20px'
            }}>
              <Clock size={14} />
              <span>Built for emergencies · Available 24/7 (simulated)</span>
            </div>

            <h2 style={{
              fontSize: '36px',
              fontWeight: '800',
              letterSpacing: '-0.03em',
              color: '#ffffff',
              lineHeight: 1.2,
              margin: '0 0 16px 0'
            }}>
              Ready for Municipal Corridor Trials
            </h2>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#dfe0df',
              margin: '0 0 32px 0',
              maxWidth: '540px'
            }}>
              LifeLane AI interfaces with existing SCATS, SCOOT, and adaptive traffic controllers. Connect with our engineering group to initiate digital twin testing on your city grid.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <button 
                onClick={onRequestDemo}
                className="btn-primary"
                style={{
                  padding: '14px 28px',
                  fontSize: '15px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Request Technical Briefing</span>
                <ArrowRight size={16} />
              </button>

              <a 
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  padding: '14px 24px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'background-color 0.2s'
                }}
              >
                <Github size={18} />
                <span>Source Repository</span>
              </a>
            </div>
          </div>

          {/* Right Direct Contact Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Phone Card */}
            <a 
              href="tel:+918000000000"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                textDecoration: 'none',
                color: '#ffffff',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = '#f36e20';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <div style={{
                backgroundColor: '#f36e20',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Phone size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f36e20', fontWeight: '700' }}>
                  24/7 Operations Desk (Demo Line · Non-Operational)
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '2px' }}>
                  +91 80 0000 0000
                </div>
                <div style={{ fontSize: '13px', color: '#dfe0df', marginTop: '2px' }}>
                  Simulated dispatch operator desk
                </div>
              </div>
            </a>

            {/* Email Card */}
            <a 
              href="mailto:demo-ops@lifelane-ai.local"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                textDecoration: 'none',
                color: '#ffffff',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = '#f36e20';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mail size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dfe0df', fontWeight: '700' }}>
                  Municipal Inquiries (Demo)
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '2px' }}>
                  demo-ops@lifelane-ai.local
                </div>
                <div style={{ fontSize: '13px', color: '#dfe0df', marginTop: '2px' }}>
                  Simulated corridor sandbox credentials provided
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

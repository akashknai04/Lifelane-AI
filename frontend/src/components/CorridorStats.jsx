import React from 'react';
import { MapPin, ArrowRight, Layers, Cpu, GitFork, Calendar } from 'lucide-react';

export default function CorridorStats({ onOpenSim }) {
  return (
    <section id="corridor-stats" style={{ padding: '96px 0', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e1e0' }}>
      <div className="container-custom">
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '36px',
          padding: '64px 48px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '400px',
            height: '400px',
            backgroundColor: 'rgba(243, 110, 32, 0.15)',
            filter: 'blur(80px)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Left Column */}
            <div>
              <div className="pill-badge" style={{ backgroundColor: '#1e293b', color: '#f36e20', border: '1px solid #334155', marginBottom: '16px' }}>
                <MapPin size={13} color="#f36e20" />
                <span>Metropolitan Corridors</span>
              </div>

              <h2 style={{ fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '20px' }}>
                Ready for Municipal Scale.<br />
                <span style={{ color: '#f36e20' }}>Proven in Digital Twin.</span>
              </h2>

              <p style={{ fontSize: '17px', color: '#94a3b8', lineHeight: 1.65, maxWidth: '500px', marginBottom: '32px' }}>
                Engineered for dense metropolitan signal networks. The digital twin simulator models realistic urban arterial topologies, vehicle queues, and dynamic signal preemption without disrupting live civilian traffic.
              </p>

              <button 
                onClick={onOpenSim}
                className="btn-primary"
                style={{ padding: '14px 32px', fontSize: '15px' }}
              >
                <span>Launch Digital Twin Corridor</span>
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Right Column: 4 Real Fact Stats (Rule 5) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px'
            }}>
              <div style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid #334155'
              }}>
                <div style={{ color: '#f36e20', marginBottom: '12px' }}>
                  <Layers size={24} />
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#f8fafc', lineHeight: 1 }}>
                  04
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1', marginTop: '6px' }}>
                  Subsystems
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Tracking, AI, Signals, Diversion
                </div>
              </div>

              <div style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid #334155'
              }}>
                <div style={{ color: '#f36e20', marginBottom: '12px' }}>
                  <Cpu size={24} />
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#f8fafc', lineHeight: 1 }}>
                  06
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1', marginTop: '6px' }}>
                  AI Modules
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Prediction, Routing, Vision, Priority
                </div>
              </div>

              <div style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid #334155'
              }}>
                <div style={{ color: '#f36e20', marginBottom: '12px' }}>
                  <GitFork size={24} />
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#f8fafc', lineHeight: 1 }}>
                  10
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1', marginTop: '6px' }}>
                  Workflow Steps
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Closed-loop dispatch to police HUD
                </div>
              </div>

              <div style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid #334155'
              }}>
                <div style={{ color: '#f36e20', marginBottom: '12px' }}>
                  <Calendar size={24} />
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#f8fafc', lineHeight: 1 }}>
                  16
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#cbd5e1', marginTop: '6px' }}>
                  Week Plan
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  6 phases from core to hardening
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

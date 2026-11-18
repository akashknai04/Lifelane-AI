import React from 'react';
import { ArrowRight, Play, Siren, Zap, Radio, CheckCircle, Clock } from 'lucide-react';

export default function Hero({ onExplore, onRunSim }) {
  return (
    <section className="bg-pattern" style={{
      padding: '72px 0 96px',
      borderBottom: '1px solid #e0e1e0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="container-custom">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          {/* Left Column: Eyebrow, Heading, Body, CTAs */}
          <div>
            <div className="pill-badge" style={{ marginBottom: '20px' }}>
              <Siren size={14} color="#f36e20" />
              <span>Proactive AI Traffic Intelligence</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: '800',
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#3a3b3a',
              marginBottom: '20px'
            }}>
              Every minute counts.<br />
              <span style={{ color: '#f36e20' }}>We clear the way.</span>
            </h1>

            <p style={{
              fontSize: '18px',
              lineHeight: 1.6,
              color: '#626462',
              maxWidth: '560px',
              marginBottom: '36px'
            }}>
              Predictive Green Corridors for Ambulances, Fire Engines & Police — built on real-time AI traffic intelligence. 
              Existing navigation reacts to where a vehicle is; <strong>LifeLane AI acts on where it will be</strong>.
              <em> "It doesn't just build a faster route. It builds a safer city."</em>
            </p>

            {/* Two Main CTAs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <a 
                href="#subsystems"
                className="btn-primary"
                onClick={onExplore}
                style={{ padding: '14px 34px', fontSize: '16px' }}
              >
                <span>Explore Platform</span>
                <ArrowRight size={18} />
              </a>

              <a 
                href="#simulation"
                className="btn-secondary"
                onClick={onRunSim}
                style={{ padding: '14px 32px', fontSize: '16px' }}
              >
                <Play size={16} color="#f36e20" fill="#f36e20" />
                <span>Run Live Simulation</span>
              </a>
            </div>

            {/* Quick Proof Badges */}
            <div style={{
              marginTop: '40px',
              paddingTop: '28px',
              borderTop: '1px solid rgba(224, 225, 224, 0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#626462'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" />
                <span>500 ms Telemetry Cadence</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" />
                <span>2–3 Intersections Pre-Cleared</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" />
                <span>Offline Edge Fail-Safe</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card (Corridor Approach Preview) */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '32px',
            border: '1px solid #e0e1e0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden'
          }}>
            {/* Terminal Window Header */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', marginLeft: '6px', letterSpacing: '0.04em' }}>
                  CENTRAL CORRIDOR · BENGALURU
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="target-badge" style={{ backgroundColor: 'rgba(243, 110, 32, 0.2)', color: '#f36e20', borderColor: 'rgba(243, 110, 32, 0.4)' }}>
                  Simulated
                </span>
                <span className="target-badge" style={{ backgroundColor: '#10b98126', color: '#10b981', borderColor: '#10b98155' }}>
                  500ms Active
                </span>
              </div>
            </div>

            {/* Inner Dashboard Simulation Frame */}
            <div style={{ padding: '24px', backgroundColor: '#f8fafc' }}>
              {/* Emergency Mission Card */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e0e1e0',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#f36e201f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f36e20'
                  }}>
                    <Siren size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#3a3b3a' }}>
                      Ambulance 108 · Mission LL-2026-8941
                    </div>
                    <div style={{ fontSize: '12px', color: '#626462' }}>
                      Destination: Victoria Hospital Trauma Centre
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>
                    Corridor Status
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>
                    GREEN PREEMPTION
                  </div>
                </div>
              </div>

              {/* Signals Approach List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#3a3b3a' }}>1. St. John's Hospital Junction</div>
                      <div style={{ fontSize: '11px', color: '#626462' }}>Dist: 280 m · Pre-cleared 7.2s before arrival</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981' }}>GREEN (HELD)</span>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#3a3b3a' }}>2. Dairy Circle Flyover Signal</div>
                      <div style={{ fontSize: '11px', color: '#626462' }}>Dist: 820 m · Transitioning to Green corridor</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981' }}>PRE-CLEARING</span>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e1e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#3a3b3a' }}>3. Adugodi Bosch Gate Junction</div>
                      <div style={{ fontSize: '11px', color: '#626462' }}>Dist: 1,450 m · Staged for advance trigger</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b' }}>STANDBY</span>
                </div>
              </div>

              {/* Projected Metric Box */}
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#fef2ec',
                borderRadius: '12px',
                border: '1px solid rgba(243, 110, 32, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#f36e20" />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#3a3b3a' }}>
                    Estimated Trip Delay Saved: <strong>+4 min 12s</strong>
                  </span>
                </div>
                <span className="target-badge">Projected target</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

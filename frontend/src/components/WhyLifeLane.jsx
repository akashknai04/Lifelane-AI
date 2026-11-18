import React from 'react';
import { Eye, ShieldCheck, WifiOff, ArrowRight } from 'lucide-react';

const REASONS = [
  {
    num: "01",
    title: "Predict, don't react",
    headline: "Acts on where the vehicle will be, not just where it is.",
    body: "Conventional emergency systems and sirens only react when an ambulance arrives directly at an intersection queue. LifeLane AI anticipates congestion 5–10 minutes downstream using graph neural networks, pre-clearing lights 2–3 intersections ahead so emergency responders encounter zero red lights.",
    icon: Eye
  },
  {
    num: "02",
    title: "Protect normal traffic",
    headline: "Capping collateral delay near 90 seconds per civilian vehicle.",
    body: "Emergency corridors must not paralyze the city. The AI Diversion Engine actively reroutes non-emergency traffic to parallel arterials and lengthens their green phases, strictly bounding background commuter delays to < 90 seconds per non-emergency vehicle.",
    icon: ShieldCheck
  },
  {
    num: "03",
    title: "Keep working offline",
    headline: "Edge intelligence preserves corridors when cloud drops.",
    body: "Critical municipal life-safety infrastructure cannot depend solely on cellular connectivity. If central cloud connections drop, edge intersection signal controllers maintain corridor coordination locally via MQTT and peer-to-peer fallback state machines.",
    icon: WifiOff
  }
];

export default function WhyLifeLane({ onExplore }) {
  return (
    <section id="why" style={{ padding: '96px 0', backgroundColor: '#f8f8f8', borderBottom: '1px solid #e0e1e0' }}>
      <div className="container-custom">
        {/* Section Header Rhythm */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
          <div className="pill-badge" style={{ margin: '0 auto 16px' }}>
            <span>Architectural Differentiators</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: '800', letterSpacing: '-0.03em', color: '#3a3b3a', marginBottom: '16px' }}>
            Why LifeLane AI?
          </h2>
          <p style={{ fontSize: '18px', color: '#626462', lineHeight: 1.6 }}>
            Designed from first principles to overcome the six systemic bottlenecks that stall urban emergency vehicles today.
          </p>
        </div>

        {/* Three Numbered Cards 01 - 03 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px'
        }}>
          {REASONS.map((r) => {
            const Icon = r.icon;
            return (
              <div 
                key={r.num}
                className="card-base"
                style={{
                  backgroundColor: '#ffffff',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '32px',
                  padding: '40px 32px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{
                      fontSize: '40px',
                      fontWeight: '800',
                      color: '#f36e20',
                      letterSpacing: '-0.04em',
                      lineHeight: 1
                    }}>
                      {r.num}
                    </span>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#fef2ec',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f36e20'
                    }}>
                      <Icon size={22} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#3a3b3a', marginBottom: '10px' }}>
                    {r.title}
                  </h3>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#f36e20', marginBottom: '16px' }}>
                    {r.headline}
                  </div>
                  <p style={{ fontSize: '15px', color: '#626462', lineHeight: 1.65 }}>
                    {r.body}
                  </p>
                </div>

                <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e0e1e0' }}>
                  <a 
                    href="#stepper" 
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#3a3b3a',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>View In Workflow</span>
                    <ArrowRight size={14} color="#f36e20" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

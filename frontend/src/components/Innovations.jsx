import React from 'react';
import { ShieldCheck, GitMerge, Clock, WifiOff, Car, Binary, ArrowRight } from 'lucide-react';

const INNOVATIONS = [
  {
    num: "1",
    title: "Predictive Green Corridor",
    headline: "Clears signals 2–3 intersections ahead.",
    body: "Rather than waiting for the siren to trigger a local sensor at the stop line, LifeLane calculates arrival vectors in advance. The emergency vehicle never meets a red light or deceleration transition delay.",
    icon: ShieldCheck
  },
  {
    num: "2",
    title: "Multi-Vehicle Priority Queue",
    headline: "Deterministic arbitration for simultaneous runs.",
    body: "When multiple emergency responders converge on an intersection, a dual rules + AI engine resolves conflicts in <1s using strict priority classes (cardiac/trauma > fire tender > police) and ETA timestamps.",
    icon: GitMerge
  },
  {
    num: "3",
    title: "Real-Time Time-Saved Metric",
    headline: "Concrete, measurable impact versus standard navigation.",
    body: "Continuously benchmarks the active AI route against unassisted historical baselines, reporting honest travel-time savings on in-vehicle HUDs and police command consoles (labeled 'Simulated estimate').",
    icon: Clock
  },
  {
    num: "4",
    title: "Edge Computing Fallback",
    headline: "Corridors persist even if cloud connectivity drops.",
    body: "Signal controllers run local peer-to-peer state machines over MQTT and wireless mesh. If central cellular or cloud backhaul drops, localized green corridor progression continues uninterrupted.",
    icon: WifiOff
  },
  {
    num: "5",
    title: "Traffic Impact Minimisation",
    headline: "Parallel arterial green extension instead of gridlock.",
    body: "Normal traffic is dynamically diverted to parallel roads with extended green phase timing. Collateral delay is strictly bounded to <90 seconds per civilian vehicle (Projected target).",
    icon: Car
  },
  {
    num: "6",
    title: "Digital Twin Simulation",
    headline: "Validated road network sandbox before live deployment.",
    body: "Municipal routing strategies, signal timing thresholds, and multi-vehicle conflict rules are modeled and audited across hundreds of simulated scenarios before touching real-world street controllers.",
    icon: Binary
  }
];

export default function Innovations() {
  return (
    <section id="innovations" style={{
      backgroundColor: '#ffffff',
      padding: '96px 0',
      borderBottom: '1px solid #e0e1e0'
    }}>
      <div className="container-custom">
        {/* Eyebrow -> Heading -> Body Rhythm */}
        <div style={{ maxWidth: '820px', marginBottom: '56px' }}>
          <div className="eyebrow">
            Architectural Novelty
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: '#3a3b3a',
            lineHeight: 1.15,
            margin: '0 0 16px 0'
          }}>
            What Sets LifeLane AI Apart
          </h2>
          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#626462',
            margin: 0
          }}>
            Six foundational innovations that distinguish LifeLane AI from reactive siren-based strobe preemption and standard consumer navigation apps.
          </p>
        </div>

        {/* 6 Innovations Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px'
        }}>
          {INNOVATIONS.map((inn) => {
            const Icon = inn.icon;
            return (
              <div 
                key={inn.num}
                className="card"
                style={{
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '3px solid #dfe0df'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderTopColor = '#f36e20'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderTopColor = '#dfe0df'; }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#f36e20',
                      backgroundColor: '#fef2ec',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      Innovation 0{inn.num}
                    </span>
                    <div style={{
                      backgroundColor: '#eeefee',
                      padding: '8px',
                      borderRadius: '10px',
                      color: '#3a3b3a'
                    }}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: '19px',
                    fontWeight: '700',
                    color: '#3a3b3a',
                    margin: '0 0 8px 0'
                  }}>
                    {inn.title}
                  </h3>

                  <p style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#f36e20',
                    lineHeight: 1.4,
                    marginBottom: '10px'
                  }}>
                    {inn.headline}
                  </p>

                  <p style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#626462',
                    margin: 0
                  }}>
                    {inn.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
